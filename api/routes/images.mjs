import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { PROJECT_ROOT } from "./photography.mjs";
import { inferAspectRatio, inferOrientation } from "../../scripts/image-presentation.mjs";

/* ── Paths — match the existing project conventions ── */

const ORIGINALS_DIR = path.join(PROJECT_ROOT, "assets", "originals", "photography");
const PERSONAL_DIR = path.join(ORIGINALS_DIR, "personal");
const CLIENT_WORK_DIR = path.join(ORIGINALS_DIR, "client-work");
const CLIENT_WORK_COLLECTIONS = new Set(["automotive", "event", "product", "real-estate"]);
const THUMBS_DIR = path.join(PROJECT_ROOT, "public", "photography", "thumbs");
const FULL_DIR = path.join(PROJECT_ROOT, "public", "photography", "full");
const DEV_IMAGE_DIR = path.join(PROJECT_ROOT, "public", "dev");

/* ── Sharp settings — identical to scripts/optimize-images.mjs ── */

const THUMBNAIL_WIDTH = 1600;
const FULL_WIDTH = 2800;
const THUMBNAIL_QUALITY = 78;
const FULL_QUALITY = 84;

/**
 * Convert a filename to a URL-safe stem.
 * Identical logic to scripts/optimize-images.mjs → toUrlSafeStem().
 */
function toUrlSafeStem(filename) {
  return path
    .basename(filename, path.extname(filename))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Ensure a stem is unique by appending -2, -3, etc. if a file already exists.
 */
async function getUniqueStem(baseStem) {
  let stem = baseStem;
  let counter = 1;
  while (true) {
    try {
      await fs.access(path.join(THUMBS_DIR, `${stem}.webp`));
      counter++;
      stem = `${baseStem}-${counter}`;
    } catch {
      return stem;
    }
  }
}

/**
 * Process a single uploaded image through the Sharp pipeline.
 *
 * 1. Saves the original into assets/originals/photography/<collectionSlug>/
 * 2. Generates thumb (1600px Q78) and full (2800px Q84) WebP
 *
 * Returns { src, thumbnailSrc } paths ready for photography.json.
 */
export async function processImage(buffer, originalFilename, collectionSlug) {
  const baseStem = toUrlSafeStem(originalFilename);
  const stem = await getUniqueStem(baseStem);
  const metadata = await sharp(buffer).metadata();

  /* Ensure output directories exist */
  const originalsSubDir = CLIENT_WORK_COLLECTIONS.has(collectionSlug)
    ? path.join(CLIENT_WORK_DIR, collectionSlug)
    : PERSONAL_DIR;
  await fs.mkdir(originalsSubDir, { recursive: true });
  await fs.mkdir(THUMBS_DIR, { recursive: true });
  await fs.mkdir(FULL_DIR, { recursive: true });

  /* Save the original with the same unique stem used by generated assets. */
  const originalExtension = path.extname(originalFilename).toLowerCase() || ".jpg";
  await fs.writeFile(path.join(originalsSubDir, `${stem}${originalExtension}`), buffer);

  /* Generate thumbnail */
  await sharp(buffer)
    .rotate()
    .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
    .webp({ quality: THUMBNAIL_QUALITY, effort: 4 })
    .toFile(path.join(THUMBS_DIR, `${stem}.webp`));

  /* Generate full-size */
  await sharp(buffer)
    .rotate()
    .resize({ width: FULL_WIDTH, withoutEnlargement: true })
    .webp({ quality: FULL_QUALITY, effort: 4 })
    .toFile(path.join(FULL_DIR, `${stem}.webp`));

  return {
    src: `/photography/full/${stem}.webp`,
    thumbnailSrc: `/photography/thumbs/${stem}.webp`,
    aspectRatio: inferAspectRatio(metadata.width, metadata.height),
    orientation: inferOrientation(metadata.width, metadata.height),
  };
}

/** Convert a dev portfolio upload into one site-ready WebP image. */
export async function processDevImage(buffer, originalFilename) {
  const baseStem = toUrlSafeStem(originalFilename) || "dev-image";
  const filename = `${baseStem}-${randomUUID()}.webp`;
  await fs.mkdir(DEV_IMAGE_DIR, { recursive: true });
  await sharp(buffer)
    .rotate()
    .resize({ width: 1800, withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toFile(path.join(DEV_IMAGE_DIR, filename));
  return `/dev/${filename}`;
}

/** Remove only generated dev images within the managed public/dev directory. */
export async function deleteDevImage(imageUrl) {
  if (typeof imageUrl !== "string" || !/^\/dev\/[a-z0-9][a-z0-9-]*\.webp$/i.test(imageUrl)) return;
  await fs.rm(path.join(DEV_IMAGE_DIR, path.basename(imageUrl)), { force: true });
}

/**
 * Delete the generated WebP files (thumb + full) for a photo.
 * Also attempts to find and remove the original from assets/.
 */
export async function deleteImageFiles(photo) {
  /* Only attempt deletion for photos that have actual image paths */
  if (!photo.src && !photo.thumbnailSrc) return;

  /* Delete generated WebP files */
  if (photo.src) {
    await fs.rm(path.join(FULL_DIR, path.basename(photo.src)), { force: true });
  }
  if (photo.thumbnailSrc) {
    await fs.rm(path.join(THUMBS_DIR, path.basename(photo.thumbnailSrc)), { force: true });
  }

  /* Try to find and remove the original (search flat dir + all subdirs) */
  const stem = photo.src ? path.basename(photo.src, ".webp") : null;
  if (!stem) return;

  await deleteOriginalByStem(ORIGINALS_DIR, stem);
}

async function deleteOriginalByStem(dir, stem) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (await deleteOriginalByStem(entryPath, stem)) return true;
      } else if (toUrlSafeStem(entry.name) === stem) {
        await fs.rm(entryPath, { force: true });
        return true;
      }
    }
  } catch {
    /* originals directory might not exist */
  }
  return false;
}
