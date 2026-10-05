import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const referenced = new Set();
const pattern = /\/photography\/(?:full|thumbs)\/[A-Za-z0-9._-]+/g;

// Include canonical JSON and hardcoded references in public source modules.
async function collect(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(file);
    else if (/\.(?:json|ts|tsx|css)$/.test(entry.name)) {
      const source = await fs.readFile(file, "utf8");
      for (const url of source.match(pattern) ?? []) referenced.add(url);
    }
  }
}
for (const directory of ["data", "app", "components"]) {
  await collect(path.join(root, directory));
}
if (!referenced.size) throw new Error("No photography references found; refusing to archive assets.");
for (const url of referenced) await fs.access(path.join(root, "public", url.slice(1)));

const candidates = [];
for (const folder of ["full", "thumbs"]) {
  const directory = path.join(root, "public", "photography", folder);
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".webp")) continue;
    if (referenced.has(`/photography/${folder}/${entry.name}`)) continue;
    candidates.push({ source: path.join(directory, entry.name), folder, name: entry.name });
  }
}

let bytes = 0;
for (const { source, folder, name } of candidates) {
  const archive = path.join(root, "assets", "archive", "photography", folder);
  await fs.mkdir(archive, { recursive: true });
  const destination = path.join(archive, name);
  const content = await fs.readFile(source);
  try {
    await fs.writeFile(destination, content, { flag: "wx" });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    if (!content.equals(await fs.readFile(destination))) {
      throw new Error(`Archive contains a different file: ${destination}`);
    }
  }
  await fs.unlink(source);
  bytes += content.length;
}
console.log(`Archived ${candidates.length} unused photography assets (${(bytes / 1024 / 1024).toFixed(2)} MiB).`);
console.log("Originals and referenced web images are preserved. Archive: assets/archive/photography/");
