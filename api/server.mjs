import fs from "node:fs";
import path from "node:path";
import express from "express";
import multer from "multer";
import { readData, writeData, findCollection, PROJECT_ROOT } from "./routes/photography.mjs";
import { processImage, deleteImageFiles, processDevImage, deleteDevImage } from "./routes/images.mjs";
import { analyzePhoto, analyzeCollection, analyzePortfolioProfile, getAiStatus, checkAiService, normalizePhotoTags } from "./routes/ai.mjs";
import { getActivity, recordActivity } from "./activity-log.mjs";
import { saveAiConfiguration } from "./routes/ai-config.mjs";
import { normalizeFocalPoint } from "../scripts/image-presentation.mjs";
import {
  DEV_COLLECTIONS,
  findDevCollectionItem,
  findDevProject,
  normalizeDevCollectionItem,
  normalizeDevProject,
  readDevData,
  writeDevData,
} from "./routes/dev.mjs";

const PORT = Number(process.env.ADMIN_PORT || 4000);

/* ── Load .env.local (if present) for optional ADMIN_PASSWORD ── */

for (const envFilename of [".env", ".env.local"]) {
  try {
    const envPath = path.join(PROJECT_ROOT, envFilename);
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
      if (envFilename === ".env.local" || !process.env[key]) process.env[key] = value;
    }
  } catch {
    /* An env file is optional; the AI service reports missing settings clearly. */
  }
}

/* ── Express setup ── */

const app = express();
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/\.(jpe?g|png|tiff?|webp)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(Object.assign(new Error("Only image files (JPEG, PNG, TIFF, WebP) are accepted."), { statusCode: 400 }));
    }
  },
});

const cvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/\.pdf$/i.test(file.originalname) && file.mimetype === "application/pdf") cb(null, true);
    else cb(Object.assign(new Error("Choose a PDF file for the CV."), { statusCode: 400 }));
  },
});

/* Serve photography images so the admin UI can display thumbnails */
app.use("/photography", express.static(path.join(PROJECT_ROOT, "public", "photography")));
app.use("/dev", express.static(path.join(PROJECT_ROOT, "public", "dev")));

/* Serve admin UI static files (built in Phase 3) */
app.use(express.static(path.join(PROJECT_ROOT, "admin", "ui")));

app.get("/photography-admin", (_req, res) => {
  res.sendFile(path.join(PROJECT_ROOT, "admin", "ui", "photography.html"));
});

/* The dev portfolio has its own admin shell and information architecture. */
app.get("/dev-admin", (_req, res) => {
  res.sendFile(path.join(PROJECT_ROOT, "admin", "ui", "dev.html"));
});

/* ── Optional password middleware ── */

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (ADMIN_PASSWORD) {
  app.use("/api", (req, res, next) => {
    const token = req.headers["x-admin-password"];
    if (token !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized — set x-admin-password header." });
    }
    next();
  });
  console.log("🔒 Password protection enabled.");
}

/* ── Async route wrapper ── */

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function activityContext(req) {
  return {
    collection: req.params.slug,
    photo: req.params.id,
  };
}

function normalizeFeaturedRank(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const rank = Number(value);
  return [1, 2, 3].includes(rank) ? rank : undefined;
}

function normalizeLocation(value) {
  if (value === undefined || value === null) return undefined;
  const location = String(value).trim();
  return location || undefined;
}

function normalizePhotoProcess(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || value.trim().length > 1000) {
    throw Object.assign(new Error("process must be a string of 1000 characters or fewer."), { statusCode: 400 });
  }
  return value.trim() || undefined;
}

function applyFeaturedRank(collection, photo, value) {
  const rank = normalizeFeaturedRank(value);
  if (!rank) {
    delete photo.featuredRank;
    return;
  }

  for (const other of collection.photos) {
    if (other !== photo && other.featuredRank === rank) delete other.featuredRank;
  }
  photo.featuredRank = rank;
}

function normalizedProfileText(value, field, maxLength) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) {
    throw Object.assign(new Error(`${field} must be a non-empty string of ${maxLength} characters or fewer.`), { statusCode: 400 });
  }
  return value.trim();
}

function normalizedEmail(value) {
  const email = normalizedProfileText(value, "email", 320);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw Object.assign(new Error("email must be a valid email address."), { statusCode: 400 });
  }
  return email;
}

function normalizedHeroImages(value, data) {
  if (!Array.isArray(value) || value.length !== 3) {
    throw Object.assign(new Error("hero images must contain exactly three selections."), { statusCode: 400 });
  }

  const selected = new Set();
  return value.map((entry, index) => {
    const collectionSlug = typeof entry?.collectionSlug === "string" ? entry.collectionSlug.trim() : "";
    const photoId = typeof entry?.photoId === "string" ? entry.photoId.trim() : "";
    if (!collectionSlug || !photoId) {
      throw Object.assign(new Error(`Hero image ${index + 1} must include a collectionSlug and photoId.`), { statusCode: 400 });
    }

    const key = `${collectionSlug}:${photoId}`;
    if (selected.has(key)) {
      throw Object.assign(new Error("Hero images must be three different portfolio photos."), { statusCode: 400 });
    }
    selected.add(key);

    const result = findCollection(data, collectionSlug);
    const photo = result?.collection.photos.find((item) => item.id === photoId);
    if (!photo) {
      throw Object.assign(new Error(`Hero image ${index + 1} references a photo that does not exist.`), { statusCode: 400 });
    }
    if (photo.isPlaceholder || typeof photo.src !== "string" || !photo.src.startsWith("/")) {
      throw Object.assign(new Error(`Hero image ${index + 1} must reference a real portfolio photo.`), { statusCode: 400 });
    }

    return { collectionSlug, photoId, photo };
  });
}

function heroUsesPhoto(data, collectionSlug, photo) {
  return (data.hero?.images || []).some((image) => (
    (image.collectionSlug === collectionSlug && image.photoId === photo.id)
      || (!image.photoId && image.src === photo.src)
  ));
}

function normalizedSocialLinks(value) {
  if (!Array.isArray(value) || value.length > 12) {
    throw Object.assign(new Error("socialLinks must be an array of at most 12 links."), { statusCode: 400 });
  }
  return value.map((link, index) => {
    if (!link || typeof link !== "object") {
      throw Object.assign(new Error(`socialLinks[${index}] must be an object.`), { statusCode: 400 });
    }
    const label = normalizedProfileText(link.label, `socialLinks[${index}].label`, 80);
    const href = normalizedProfileText(link.href, `socialLinks[${index}].href`, 1000);
    let parsed;
    try { parsed = new URL(href); } catch { parsed = null; }
    if (!parsed || !["http:", "https:"].includes(parsed.protocol)) {
      throw Object.assign(new Error(`socialLinks[${index}].href must be an http(s) URL.`), { statusCode: 400 });
    }
    return { label, href };
  });
}

/* ─────────────────────────────────────────────
   API Routes — Full data (read / overwrite)
   ───────────────────────────────────────────── */

app.get(
  "/api/activity",
  asyncHandler(async (req, res) => {
    res.json(await getActivity(req.query.limit));
  }),
);

/** Return photography counts and generated image storage for the workspace overview. */
app.get(
  "/api/photography/overview",
  asyncHandler(async (_req, res) => {
    const data = await readData();
    const collections = [...data.primaryCollections, ...data.archiveCollections];
    const photos = collections.flatMap((collection) => collection.photos);
    const imageExtensions = new Set([".webp", ".jpg", ".jpeg", ".png", ".tif", ".tiff"]);

    async function measureDirectory(directory) {
      let bytes = 0;
      let files = 0;
      let entries = [];
      try {
        entries = await fs.promises.readdir(directory, { withFileTypes: true });
      } catch (error) {
        if (error.code === "ENOENT") return { bytes, files };
        throw error;
      }

      for (const entry of entries) {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          const nested = await measureDirectory(entryPath);
          bytes += nested.bytes;
          files += nested.files;
        } else if (entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase())) {
          const stat = await fs.promises.stat(entryPath);
          bytes += stat.size;
          files += 1;
        }
      }
      return { bytes, files };
    }

    const imageRoot = path.join(PROJECT_ROOT, "public", "photography");
    const [full, thumbs] = await Promise.all([
      measureDirectory(path.join(imageRoot, "full")),
      measureDirectory(path.join(imageRoot, "thumbs")),
    ]);
    res.json({
      photoCount: photos.filter((photo) => !photo.isPlaceholder && (photo.src || photo.thumbnailSrc)).length,
      collectionCount: collections.length,
      primaryCollectionCount: data.primaryCollections.length,
      archiveCollectionCount: data.archiveCollections.length,
      storage: {
        bytes: full.bytes + thumbs.bytes,
        imageCount: full.files + thumbs.files,
        fullBytes: full.bytes,
        thumbnailBytes: thumbs.bytes,
        fullImageCount: full.files,
        thumbnailCount: thumbs.files,
      },
    });
  }),
);

/* The browser reports one summary event after its client-orchestrated batch. */
app.post(
  "/api/activity",
  asyncHandler(async (req, res) => {
    if (req.body?.action !== "ai.batch.completed") {
      return res.status(400).json({ error: "Only batch activity summaries can be recorded." });
    }

    const completed = Math.max(0, Number(req.body.completed) || 0);
    const failed = Math.max(0, Number(req.body.failed) || 0);
    await recordActivity({
      kind: failed ? "error" : "audit",
      action: "ai.batch.completed",
      collection: req.body.collection,
      message: failed
        ? `Batch analysis completed with ${completed} saved and ${failed} failed.`
        : `Batch analysis saved ${completed} photo${completed === 1 ? "" : "s"}.`,
      counts: { completed, failed },
    });
    res.json({ success: true });
  }),
);

/** Return the full photography.json contents. */
app.get(
  "/api/photography",
  asyncHandler(async (_req, res) => {
    const data = await readData();
    res.json(data);
  }),
);

/** Overwrite photography.json with the provided JSON body. */
app.put(
  "/api/photography",
  asyncHandler(async (req, res) => {
    await writeData(req.body);
    await recordActivity({
      action: "photography.updated",
      message: "Photography data overwritten from the admin dashboard.",
    });
    res.json({ success: true });
  }),
);

app.put(
  "/api/photography/profile",
  asyncHandler(async (req, res) => {
    const data = await readData();
    const incoming = req.body || {};
    const profile = { ...(data.profile || {}) };

    if (incoming.intro !== undefined) profile.intro = normalizedProfileText(incoming.intro, "intro", 360);
    if (incoming.about !== undefined) profile.about = normalizedProfileText(incoming.about, "about", 1800);
    if (incoming.email !== undefined) profile.email = normalizedEmail(incoming.email);
    if (incoming.socialLinks !== undefined) profile.socialLinks = normalizedSocialLinks(incoming.socialLinks);

    const updated = { ...data, profile };
    await writeData(updated);
    await recordActivity({ action: "photography.profile.updated", message: "Photography profile updated." });
    res.json(profile);
  }),
);

/* ── Dev portfolio API ─────────────────────────────────────────────── */

app.put(
  "/api/photography/hero",
  asyncHandler(async (req, res) => {
    const data = await readData();
    const selections = normalizedHeroImages(req.body?.images, data);
    const currentHero = data.hero || {};
    const currentImages = Array.isArray(currentHero.images) ? currentHero.images : [];

    const images = selections.map(({ collectionSlug, photoId, photo }, index) => ({
      ...(currentImages[index] || {}),
      collectionSlug,
      photoId,
      src: photo.src,
      alt: photo.alt || currentImages[index]?.alt || photo.title,
    }));

    data.hero = { ...currentHero, images };
    await writeData(data);
    await recordActivity({ action: "photography.hero.updated", message: "Photography hero images updated." });
    res.json(data.hero);
  }),
);

app.get(
  "/api/dev",
  asyncHandler(async (_req, res) => {
    res.json(await readDevData());
  }),
);

app.get(
  "/api/dev/cv",
  asyncHandler(async (_req, res) => {
    const cvPath = path.join(PROJECT_ROOT, "public", "resume.pdf");
    try {
      const stats = await fs.promises.stat(cvPath);
      res.json({ available: stats.isFile(), updatedAt: stats.mtime.toISOString() });
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      res.json({ available: false, updatedAt: null });
    }
  }),
);

app.post(
  "/api/dev/cv",
  cvUpload.single("cv"),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Choose a PDF file to upload." });
    if (req.file.buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
      return res.status(400).json({ error: "The selected file is not a valid PDF." });
    }

    const publicDirectory = path.join(PROJECT_ROOT, "public");
    const cvPath = path.join(publicDirectory, "resume.pdf");
    const temporaryPath = path.join(publicDirectory, `resume-${process.pid}-${Date.now()}.tmp`);
    try {
      await fs.promises.writeFile(temporaryPath, req.file.buffer, { flag: "wx" });
      await fs.promises.rename(temporaryPath, cvPath);
    } catch (error) {
      await fs.promises.rm(temporaryPath, { force: true }).catch(() => {});
      throw error;
    }
    const stats = await fs.promises.stat(cvPath);
    res.status(201).json({ available: true, updatedAt: stats.mtime.toISOString() });
  }),
);

async function removeUnreferencedDevImage(data, imageUrl) {
  if (!imageUrl || !/^\/dev\/[a-z0-9][a-z0-9-]*\.webp$/i.test(imageUrl)) return;
  const isStillUsed = data.profile?.portraitUrl === imageUrl
    || (data.projects || []).some((project) => project.coverImageUrl === imageUrl)
    || (data.certificates || []).some((certificate) => certificate.imageUrl === imageUrl);
  if (!isStillUsed) await deleteDevImage(imageUrl);
}

app.post(
  "/api/dev/images",
  upload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Choose an image to upload." });
    const imageUrl = await processDevImage(req.file.buffer, req.file.originalname);
    res.status(201).json({ imageUrl });
  }),
);

app.put(
  "/api/dev",
  asyncHandler(async (req, res) => {
    const incoming = req.body || {};
    const current = await readDevData();
    const previousPortrait = current.profile?.portraitUrl;
    const data = {
      ...current,
      ...incoming,
      profile: { ...current.profile, ...(incoming.profile || {}) },
      skills: Array.isArray(incoming.skills) ? incoming.skills.map((item) => normalizeDevCollectionItem("skills", item)) : current.skills,
      projects: Array.isArray(incoming.projects) ? incoming.projects.map((project) => normalizeDevProject(project)) : current.projects,
      journey: Array.isArray(incoming.journey) ? incoming.journey.map((item) => normalizeDevCollectionItem("journey", item)) : current.journey,
      experience: Array.isArray(incoming.experience) ? incoming.experience.map((item) => normalizeDevCollectionItem("experience", item)) : current.experience,
      certificates: Array.isArray(incoming.certificates) ? incoming.certificates.map((item) => normalizeDevCollectionItem("certificates", item)) : current.certificates,
      toolkits: Array.isArray(incoming.toolkits) ? incoming.toolkits.map((item) => normalizeDevCollectionItem("toolkits", item)) : current.toolkits,
      education: Array.isArray(incoming.education) ? incoming.education.map((item) => normalizeDevCollectionItem("education", item)) : current.education,
    };
    await writeDevData(data);
    await removeUnreferencedDevImage(data, previousPortrait);
    await recordActivity({ action: "dev.updated", message: "Dev portfolio content updated." });
    res.json(data);
  }),
);

app.post(
  "/api/dev/projects",
  asyncHandler(async (req, res) => {
    const data = await readDevData();
    const project = normalizeDevProject(req.body);
    if (!project.slug) return res.status(400).json({ error: "A project title or slug is required." });
    if (findDevProject(data, project.slug)) return res.status(409).json({ error: `A project with slug "${project.slug}" already exists.` });
    project.number = String(data.projects.length + 1).padStart(2, "0");
    data.projects.push(project);
    await writeDevData(data);
    await recordActivity({ project: project.slug, action: "dev.project.created", message: `Dev project ${project.title} created.` });
    res.status(201).json(project);
  }),
);

app.put(
  "/api/dev/projects/:slug",
  asyncHandler(async (req, res) => {
    const data = await readDevData();
    const result = findDevProject(data, req.params.slug);
    if (!result) return res.status(404).json({ error: "Dev project not found." });

    const updated = normalizeDevProject(req.body, result.project);
    if (!updated.slug) return res.status(400).json({ error: "A project title or slug is required." });
    const collision = findDevProject(data, updated.slug);
    if (collision && collision.index !== result.index) return res.status(409).json({ error: `A project with slug "${updated.slug}" already exists.` });

    data.projects[result.index] = updated;
    await writeDevData(data);
    await removeUnreferencedDevImage(data, result.project.coverImageUrl);
    await recordActivity({ project: updated.slug, action: "dev.project.updated", message: `Dev project ${updated.title} updated.` });
    res.json(updated);
  }),
);

app.delete(
  "/api/dev/projects/:slug",
  asyncHandler(async (req, res) => {
    const data = await readDevData();
    const result = findDevProject(data, req.params.slug);
    if (!result) return res.status(404).json({ error: "Dev project not found." });

    const [removed] = data.projects.splice(result.index, 1);
    data.projects.forEach((project, index) => { project.number = String(index + 1).padStart(2, "0"); });
    await writeDevData(data);
    await removeUnreferencedDevImage(data, removed.coverImageUrl);
    await recordActivity({ project: removed.slug, action: "dev.project.deleted", message: `Dev project ${removed.title} deleted.` });
    res.json({ success: true, removed });
  }),
);

function assertDevCollection(collection) {
  if (!DEV_COLLECTIONS.has(collection)) {
    const error = new Error("Unknown dev content collection.");
    error.statusCode = 404;
    throw error;
  }
}

function resequenceDevCollection(data, collection) {
  if (collection === "journey") return;
  data[collection].forEach((item, index) => {
    item.number = String(index + 1).padStart(2, "0");
  });
}

app.post(
  "/api/dev/:collection",
  asyncHandler(async (req, res) => {
    const { collection } = req.params;
    assertDevCollection(collection);
    const data = await readDevData();
    data[collection] ??= [];
    const item = normalizeDevCollectionItem(collection, req.body);
    if (!item.slug) return res.status(400).json({ error: "A title is required." });
    if (findDevCollectionItem(data, collection, item.slug)) return res.status(409).json({ error: "An item with this title already exists." });
    if (collection !== "journey") item.number = String(data[collection].length + 1).padStart(2, "0");
    data[collection].push(item);
    await writeDevData(data);
    await recordActivity({ action: `dev.${collection}.created`, message: `Dev ${collection} item created.` });
    res.status(201).json(item);
  }),
);

app.put(
  "/api/dev/:collection/:slug",
  asyncHandler(async (req, res) => {
    const { collection, slug } = req.params;
    assertDevCollection(collection);
    const data = await readDevData();
    const result = findDevCollectionItem(data, collection, slug);
    if (!result) return res.status(404).json({ error: "Dev content item not found." });
    const updated = normalizeDevCollectionItem(collection, req.body, result.item);
    if (!updated.slug) return res.status(400).json({ error: "A title is required." });
    const collision = findDevCollectionItem(data, collection, updated.slug);
    if (collision && collision.index !== result.index) return res.status(409).json({ error: "An item with this title already exists." });
    data[collection][result.index] = updated;
    await writeDevData(data);
    if (collection === "certificates") await removeUnreferencedDevImage(data, result.item.imageUrl);
    await recordActivity({ action: `dev.${collection}.updated`, message: `Dev ${collection} item updated.` });
    res.json(updated);
  }),
);

app.delete(
  "/api/dev/:collection/:slug",
  asyncHandler(async (req, res) => {
    const { collection, slug } = req.params;
    assertDevCollection(collection);
    const data = await readDevData();
    const result = findDevCollectionItem(data, collection, slug);
    if (!result) return res.status(404).json({ error: "Dev content item not found." });
    const [removed] = data[collection].splice(result.index, 1);
    resequenceDevCollection(data, collection);
    await writeDevData(data);
    if (collection === "certificates") await removeUnreferencedDevImage(data, removed.imageUrl);
    await recordActivity({ action: `dev.${collection}.deleted`, message: `Dev ${collection} item deleted.` });
    res.json({ success: true, removed });
  }),
);

/* ─────────────────────────────────────────────
   API Routes — Collections
   ───────────────────────────────────────────── */

/** List all collections (primary first, then archive). */
app.get(
  "/api/collections",
  asyncHandler(async (_req, res) => {
    const data = await readData();
    const all = [...data.primaryCollections, ...data.archiveCollections].map((c) => ({
      slug: c.slug,
      title: c.title,
      theme: c.theme,
      section: c.section,
      coverImage: c.coverImage,
      photoCount: c.photos.length,
    }));
    res.json(all);
  }),
);

/** Get a single collection with all its photos. */
app.get(
  "/api/collections/:slug",
  asyncHandler(async (req, res) => {
    const data = await readData();
    const result = findCollection(data, req.params.slug);
    if (!result) return res.status(404).json({ error: "Collection not found." });
    res.json(result.collection);
  }),
);

/* ── AI metadata suggestions (read-only, never writes portfolio data) ── */

/** Return safe AI configuration details for the admin dashboard. Never returns credentials. */
app.get(
  "/api/ai/status",
  asyncHandler(async (_req, res) => {
    res.set("Cache-Control", "no-store");
    res.json(getAiStatus());
  }),
);

app.post(
  "/api/ai/check",
  asyncHandler(async (_req, res) => {
    const status = await checkAiService();
    await recordActivity({ action: "ai.service.checked", message: "OpenAI service connection check succeeded." });
    res.set("Cache-Control", "no-store");
    res.json(status);
  }),
);

app.put(
  "/api/ai/config",
  asyncHandler(async (req, res) => {
    await saveAiConfiguration(req.body);
    await recordActivity({ action: "ai.configuration.updated", message: "Azure OpenAI settings saved and applied." });
    res.set("Cache-Control", "no-store");
    res.json(getAiStatus());
  }),
);

app.post(
  "/api/ai/profile",
  asyncHandler(async (_req, res) => {
    const data = await readData();
    const draft = await analyzePortfolioProfile(data);
    await recordActivity({
      action: "ai.profile.analyzed",
      message: `Portfolio About draft analyzed ${draft.analyzedImages} images in ${draft.batchCount} batches.`,
      counts: { images: draft.analyzedImages, batches: draft.batchCount },
    });
    res.json(draft);
  }),
);

app.post(
  "/api/ai/photo/:slug/:id",
  asyncHandler(async (req, res) => {
    const data = await readData();
    const result = findCollection(data, req.params.slug);
    if (!result) return res.status(404).json({ error: "Collection not found." });

    const suggestion = await analyzePhoto(result.collection, req.params.id, req.body?.guidance);
    res.json(suggestion);
  }),
);

app.post(
  "/api/ai/collection/:slug",
  asyncHandler(async (req, res) => {
    const data = await readData();
    const result = findCollection(data, req.params.slug);
    if (!result) return res.status(404).json({ error: "Collection not found." });

    const suggestion = await analyzeCollection(result.collection);
    res.json(suggestion);
  }),
);

/** Update collection-level fields and optionally move between sections. */
app.put(
  "/api/collections/:slug",
  asyncHandler(async (req, res) => {
    const data = await readData();
    const result = findCollection(data, req.params.slug);
    if (!result) return res.status(404).json({ error: "Collection not found." });

    const { title, theme, intro, skillsDemonstrated, section } = req.body;
    const c = result.collection;
    const previousSection = c.section;
    if (title !== undefined) c.title = title;
    if (theme !== undefined) c.theme = theme;
    if (intro !== undefined) c.intro = intro;
    if (skillsDemonstrated !== undefined) c.skillsDemonstrated = skillsDemonstrated;

    if (section !== undefined && section !== c.section) {
      if (section !== "primary" && section !== "archive") {
        return res.status(400).json({ error: "section must be primary or archive." });
      }

      const sourceList = c.section === "primary" ? data.primaryCollections : data.archiveCollections;
      const sourceIndex = sourceList.findIndex((item) => item.slug === c.slug);
      if (sourceIndex !== -1) sourceList.splice(sourceIndex, 1);

      c.section = section;
      const destinationList = section === "primary" ? data.primaryCollections : data.archiveCollections;
      destinationList.push(c);
    }

    await writeData(data);
    await recordActivity({
      ...activityContext(req),
      action: section !== undefined && section !== previousSection ? "collection.moved" : "collection.updated",
      message: section !== undefined && section !== previousSection
        ? `Collection ${c.title} moved to ${section}.`
        : `Collection ${c.title} updated.`,
    });
    res.json(c);
  }),
);

/* ─────────────────────────────────────────────
   API Routes — Photo reorder
   (defined before :id routes to avoid conflict)
   ───────────────────────────────────────────── */

/** Reorder photos within a collection. Body: { photoIds: ["id1", "id2", ...] } */
app.put(
  "/api/collections/:slug/reorder",
  asyncHandler(async (req, res) => {
    const data = await readData();
    const result = findCollection(data, req.params.slug);
    if (!result) return res.status(404).json({ error: "Collection not found." });

    const { photoIds } = req.body;
    if (!Array.isArray(photoIds)) {
      return res.status(400).json({ error: "photoIds must be an array of photo ID strings." });
    }

    const c = result.collection;
    const photoMap = new Map(c.photos.map((p) => [p.id, p]));

    /* Validate all IDs exist */
    for (const id of photoIds) {
      if (!photoMap.has(id)) {
        return res.status(400).json({ error: `Photo ID "${id}" not found in this collection.` });
      }
    }

    /* Reorder: place IDs in the specified order, append any missing ones at the end */
    const reordered = photoIds.map((id) => photoMap.get(id));
    const remaining = c.photos.filter((p) => !photoIds.includes(p.id));
    c.photos = [...reordered, ...remaining];

    await writeData(data);
    await recordActivity({
      ...activityContext(req),
      action: "photos.reordered",
      message: `Photo order updated for ${result.collection.title}.`,
      counts: { photos: photoIds.length },
    });
    res.json(c.photos);
  }),
);

/* ─────────────────────────────────────────────
   API Routes — Photos
   ───────────────────────────────────────────── */

/** Add a new photo to a collection. Multipart form: file "photo" + metadata fields. */
app.post(
  "/api/collections/:slug/photos",
  upload.single("photo"),
  asyncHandler(async (req, res) => {
    const data = await readData();
    const result = findCollection(data, req.params.slug);
    if (!result) return res.status(404).json({ error: "Collection not found." });

    if (!req.file) return res.status(400).json({ error: "No image file uploaded." });

    const { title, alt, story, process: photoProcess, location, tags, featuredRank, aspectRatio, orientation, focalPoint } = req.body;

    const normalizedProcess = normalizePhotoProcess(photoProcess);

    /* Process image through the Sharp pipeline */
    const imagePaths = await processImage(req.file.buffer, req.file.originalname, req.params.slug);

    /* Build the photo entry */
    let parsedTags = [];
    try { parsedTags = tags ? JSON.parse(tags) : []; } catch { parsedTags = []; }

    const photo = {
      id: `${req.params.slug}-${Date.now()}`,
      title: title || "Untitled",
      src: imagePaths.src,
      thumbnailSrc: imagePaths.thumbnailSrc,
      alt: alt || "",
      story: story || "",
      ...(normalizedProcess ? { process: normalizedProcess } : {}),
      tags: normalizePhotoTags(parsedTags),
      isPlaceholder: false,
    };

    photo.aspectRatio = aspectRatio || imagePaths.aspectRatio;
    photo.orientation = orientation || imagePaths.orientation;
    const normalizedLocation = normalizeLocation(location);
    if (normalizedLocation) photo.location = normalizedLocation;
    const normalizedFocalPoint = normalizeFocalPoint(focalPoint);
    if (normalizedFocalPoint) photo.focalPoint = normalizedFocalPoint;

    result.collection.photos.push(photo);
    const usedRanks = new Set(result.collection.photos
      .filter((item) => item !== photo)
      .map((item) => item.featuredRank)
      .filter(Boolean));
    const initialRank = normalizeFeaturedRank(featuredRank)
      ?? [1, 2, 3].find((rank) => !usedRanks.has(rank));
    applyFeaturedRank(result.collection, photo, initialRank);
    await writeData(data);
    await recordActivity({
      ...activityContext(req),
      photo: photo.id,
      action: "photo.uploaded",
      message: `Photo ${photo.title} uploaded to ${result.collection.title}.`,
    });
    res.status(201).json(photo);
  }),
);

/** Edit a photo's metadata and presentation fields. */
app.put(
  "/api/collections/:slug/photos/:id",
  asyncHandler(async (req, res) => {
    const data = await readData();
    const result = findCollection(data, req.params.slug);
    if (!result) return res.status(404).json({ error: "Collection not found." });

    const photo = result.collection.photos.find((p) => p.id === req.params.id);
    if (!photo) return res.status(404).json({ error: "Photo not found." });

    const { title, alt, story, process: photoProcess, location, tags, featuredRank, aspectRatio, orientation, focalPoint } = req.body;
    if (title !== undefined) photo.title = title;
    if (alt !== undefined) photo.alt = alt;
    if (story !== undefined) photo.story = story;
    if (photoProcess !== undefined) {
      const normalizedProcess = normalizePhotoProcess(photoProcess);
      if (normalizedProcess) photo.process = normalizedProcess;
      else delete photo.process;
    }
    if (tags !== undefined) {
      photo.tags = normalizePhotoTags(tags);
    }

    /* For optional presentation fields, empty string / null clears the value */
    if (featuredRank !== undefined) applyFeaturedRank(result.collection, photo, featuredRank);
    if (aspectRatio !== undefined) photo.aspectRatio = aspectRatio || undefined;
    if (orientation !== undefined) photo.orientation = orientation || undefined;
    if (location !== undefined) {
      const normalizedLocation = normalizeLocation(location);
      if (normalizedLocation) photo.location = normalizedLocation;
      else delete photo.location;
    }
    if (focalPoint !== undefined) photo.focalPoint = normalizeFocalPoint(focalPoint);

    await writeData(data);
    await recordActivity({
      ...activityContext(req),
      action: "photo.updated",
      message: `Photo metadata updated for ${photo.title}.`,
    });
    res.json(photo);
  }),
);

/** Delete a photo and its generated image files. */
app.delete(
  "/api/collections/:slug/photos/:id",
  asyncHandler(async (req, res) => {
    const data = await readData();
    const result = findCollection(data, req.params.slug);
    if (!result) return res.status(404).json({ error: "Collection not found." });

    const photos = result.collection.photos;
    const idx = photos.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Photo not found." });

    if (heroUsesPhoto(data, req.params.slug, photos[idx])) {
      return res.status(409).json({ error: "This photo is used in the homepage hero. Choose another hero photo before deleting or replacing it." });
    }

    const [removed] = photos.splice(idx, 1);

    /* Delete generated image files (thumb + full + original) */
    await deleteImageFiles(removed);

    await writeData(data);
    await recordActivity({
      ...activityContext(req),
      action: "photo.deleted",
      message: `Photo ${removed.title || removed.id} deleted from ${result.collection.title}.`,
    });
    res.json({ success: true, removed });
  }),
);

/* ── Global error handler ── */

app.use(async (err, req, res, _next) => {
  console.error("❌", err.message || err);
  await recordActivity({
    ...activityContext(req),
    kind: "error",
    action: `api.${req.method.toLowerCase()}`,
    message: err.message || "Internal server error.",
  });
  const statusCode = err.statusCode || (err.code === "LIMIT_FILE_SIZE" ? 413 : err.name === "MulterError" ? 400 : 500);
  res.status(statusCode).json({ error: err.message || "Internal server error." });
});

/* ── Start ── */

app.listen(PORT, "localhost", () => {
  console.log(`\n  📷  Admin server running at  http://localhost:${PORT}`);
  console.log(`      Manages data in          data/photography.json`);
  console.log(`      Images processed to       public/photography/{thumbs,full}/`);
  console.log(`\n  Press Ctrl+C to stop.\n`);
});
