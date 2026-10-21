import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertPublicProfile } from "./public-profile-privacy.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(projectRoot, "data", "photography.json");
const data = JSON.parse(await fs.readFile(dataPath, "utf8"));
const missing = [];
try { assertPublicProfile(data.profile); } catch (error) { missing.push(error.message); }

function checkAsset(collectionSlug, photoId, field, publicUrl) {
  if (typeof publicUrl !== "string" || !publicUrl.startsWith("/")) {
    missing.push(`${collectionSlug}/${photoId}: ${field} must be a root-relative URL`);
    return;
  }

  const filePath = path.join(projectRoot, "public", publicUrl.slice(1));
  return fs.access(filePath).catch(() => {
    missing.push(`${collectionSlug}/${photoId}: ${field} not found at public/${publicUrl.slice(1)}`);
  });
}

const checks = [];
const overview = JSON.parse(await fs.readFile(path.join(projectRoot, "data", "photography-overview.json"), "utf8"));
if (!Array.isArray(overview.subjects) || !overview.subjects.length || overview.subjects.some(subject => typeof subject !== "string" || !subject.trim()) || new Set(overview.subjects).size !== overview.subjects.length) {
  missing.push("photography-overview.subjects must contain unique, non-empty labels");
}
for (const field of ["cities", "years"]) {
  if (!Number.isSafeInteger(overview[field]) || overview[field] < 1) missing.push(`photography-overview.${field} must be a positive integer`);
}
const approach = JSON.parse(await fs.readFile(path.join(projectRoot, "data", "photography-approach.json"), "utf8"));
const allPhotos = [...(data.primaryCollections ?? []), ...(data.archiveCollections ?? [])].flatMap(collection => collection.photos ?? []);
const demos = ["composition", "light", "grading", "motion", "storytelling"];
const approachNumbers = new Set();
if (!Array.isArray(approach) || approach.length !== demos.length || demos.some(demo => !approach.some(item => item.demo === demo))) {
  missing.push("photography-approach must contain all five principles");
} else for (const item of approach) {
  for (const field of ["number", "title", "description", "detail", "previewLabel"]) {
    if (typeof item[field] !== "string" || !item[field].trim()) missing.push(`approach: ${field} must be a non-empty string`);
  }
  if (approachNumbers.has(item.number)) missing.push(`approach: duplicate number ${item.number}`);
  approachNumbers.add(item.number);
  if (!demos.includes(item.demo)) missing.push(`approach/${item.number}: unsupported demo ${item.demo}`);
  if (!Array.isArray(item.techniques) || !item.techniques.length || item.techniques.some(tag => typeof tag !== "string" || !allPhotos.some(photo => photo.tags?.includes(tag)))) {
    missing.push(`approach/${item.number}: techniques must reference existing photography tags`);
  } else if (!allPhotos.some(photo => !photo.isPlaceholder && photo.src && photo.tags?.some(tag => item.techniques.includes(tag)))) {
    missing.push(`approach/${item.number}: no real photographs match these techniques`);
  }
}
const heroImages = data.hero?.images;
if (!Array.isArray(heroImages) || heroImages.length !== 3) {
  missing.push("hero.images must contain exactly three images");
} else {
  const heroKeys = new Set();
  heroImages.forEach((image, index) => {
    const slot = `hero/${index + 1}`;
    checks.push(checkAsset(slot, image.photoId || "legacy", "src", image.src));

    const hasCollection = Boolean(typeof image.collectionSlug === "string" && image.collectionSlug.trim());
    const hasPhoto = Boolean(typeof image.photoId === "string" && image.photoId.trim());
    if (hasCollection !== hasPhoto) {
      missing.push(`${slot}: collectionSlug and photoId must be provided together`);
      return;
    }
    if (!hasCollection) return;

    const key = `${image.collectionSlug}:${image.photoId}`;
    if (heroKeys.has(key)) missing.push(`${slot}: duplicate hero photo reference`);
    heroKeys.add(key);

    const collection = [...(data.primaryCollections ?? []), ...(data.archiveCollections ?? [])]
      .find((item) => item.slug === image.collectionSlug);
    const photo = collection?.photos?.find((item) => item.id === image.photoId);
    if (!photo) {
      missing.push(`${slot}: referenced collection/photo does not exist`);
    } else if (photo.isPlaceholder || !photo.src) {
      missing.push(`${slot}: referenced photo must be a real image`);
    }
  });
}

for (const collectionGroup of ["primaryCollections", "archiveCollections"]) {
  for (const collection of data[collectionGroup] ?? []) {
    const featuredRanks = [];
    for (const photo of collection.photos ?? []) {
      if (photo.process !== undefined && (typeof photo.process !== "string" || photo.process.trim().length > 1000)) {
        missing.push(`${collection.slug}/${photo.id}: process must be a string of 1000 characters or fewer`);
      }
      if (photo.featuredRank !== undefined) {
        if (![1, 2, 3].includes(photo.featuredRank)) {
          missing.push(`${collection.slug}/${photo.id}: featuredRank must be 1, 2, or 3`);
        } else {
          featuredRanks.push(photo.featuredRank);
        }
      }
      if (photo.isPlaceholder) continue;
      checks.push(checkAsset(collection.slug, photo.id, "src", photo.src));
      checks.push(checkAsset(collection.slug, photo.id, "thumbnailSrc", photo.thumbnailSrc));
    }

    const expectedFeatureCount = Math.min(3, (collection.photos ?? []).length);
    const sortedRanks = [...featuredRanks].sort((a, b) => a - b);
    const expectedRanks = Array.from({ length: expectedFeatureCount }, (_value, index) => index + 1);
    if (sortedRanks.length !== new Set(sortedRanks).size || sortedRanks.join(",") !== expectedRanks.join(",")) {
      missing.push(`${collection.slug}: featuredRank values must be exactly 1 through ${expectedFeatureCount}`);
    }
  }
}

await Promise.all(checks);

if (missing.length > 0) {
  console.error(`Photography asset validation failed with ${missing.length} issue(s):`);
  for (const issue of missing) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log("Photography data is valid and all referenced image assets exist.");
}
