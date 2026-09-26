import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { inferAspectRatio, inferOrientation } from "./image-presentation.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(projectRoot, "data", "photography.json");

const data = JSON.parse(await fs.readFile(dataPath, "utf8"));
let updated = 0;

for (const collection of [...(data.primaryCollections ?? []), ...(data.archiveCollections ?? [])]) {
  for (const photo of collection.photos ?? []) {
    if (photo.isPlaceholder || !photo.src) continue;

    const imagePath = path.join(projectRoot, "public", photo.src.replace(/^\//, ""));
    const metadata = await sharp(imagePath).metadata();
    const aspectRatio = inferAspectRatio(metadata.width, metadata.height);
    const orientation = inferOrientation(metadata.width, metadata.height);

    if (aspectRatio && photo.aspectRatio !== aspectRatio) {
      photo.aspectRatio = aspectRatio;
      updated++;
    }
    if (orientation && photo.orientation !== orientation) {
      photo.orientation = orientation;
      updated++;
    }
  }
}

await fs.writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Updated ${updated} presentation fields in data/photography.json.`);
