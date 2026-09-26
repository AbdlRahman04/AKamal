import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const originalsDir = path.join(projectRoot, "assets", "originals", "photography");
const publicDir = path.join(projectRoot, "public", "photography");
const thumbnailsDir = path.join(publicDir, "thumbs");
const fullDir = path.join(publicDir, "full");

const THUMBNAIL_WIDTH = 1600;
const FULL_WIDTH = 2800;
const THUMBNAIL_QUALITY = 78;
const FULL_QUALITY = 84;

function toUrlSafeStem(filename) {
  return path
    .basename(filename, path.extname(filename))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function byteTotal(files) {
  const sizes = await Promise.all(files.map(async (file) => (await fs.stat(file)).size));
  return sizes.reduce((total, size) => total + size, 0);
}

async function collectSourceImages(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectSourceImages(entryPath));
    else if (/\.(?:jpe?g|webp)$/i.test(entry.name)) files.push(entryPath);
  }
  return files;
}

await fs.mkdir(originalsDir, { recursive: true });
const discoveredImages = (await collectSourceImages(originalsDir)).sort((a, b) => a.localeCompare(b));
const originalsByStem = new Map();
for (const image of discoveredImages) {
  const stem = toUrlSafeStem(image);
  const current = originalsByStem.get(stem);
  /* Prefer migrated client-work WebP sources when a duplicate JPEG exists. */
  if (!current || (image.includes(`${path.sep}client-work${path.sep}`) && path.extname(image).toLowerCase() === ".webp")) {
    originalsByStem.set(stem, image);
  }
}
const originals = [...originalsByStem.values()].sort((a, b) => a.localeCompare(b));

if (originals.length === 0) {
  throw new Error(`No JPEG originals found in ${originalsDir}`);
}

const stems = originals.map(toUrlSafeStem);
if (new Set(stems).size !== stems.length) {
  throw new Error("Two original filenames produce the same URL-safe output name.");
}

await fs.rm(thumbnailsDir, { recursive: true, force: true });
await fs.rm(fullDir, { recursive: true, force: true });
await fs.mkdir(thumbnailsDir, { recursive: true });
await fs.mkdir(fullDir, { recursive: true });

const thumbnailFiles = [];
const fullFiles = [];

for (let index = 0; index < originals.length; index += 1) {
  const input = originals[index];
  const originalName = path.basename(input);
  const stem = stems[index];
  const thumbnail = path.join(thumbnailsDir, `${stem}.webp`);
  const full = path.join(fullDir, `${stem}.webp`);

  await sharp(input)
    .rotate()
    .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
    .webp({ quality: THUMBNAIL_QUALITY, effort: 4 })
    .toFile(thumbnail);

  await sharp(input)
    .rotate()
    .resize({ width: FULL_WIDTH, withoutEnlargement: true })
    .webp({ quality: FULL_QUALITY, effort: 4 })
    .toFile(full);

  thumbnailFiles.push(thumbnail);
  fullFiles.push(full);
  console.log(`Optimized ${index + 1}/${originals.length}: ${originalName}`);
}

const originalBytes = await byteTotal(originals);
const optimizedBytes = await byteTotal([...thumbnailFiles, ...fullFiles]);
const reduction = Math.round((1 - optimizedBytes / originalBytes) * 100);

console.log(`Generated ${thumbnailFiles.length} thumbnails and ${fullFiles.length} viewer images.`);
console.log(`Originals: ${(originalBytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`Optimized assets: ${(optimizedBytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`Combined reduction: ${reduction}%`);
