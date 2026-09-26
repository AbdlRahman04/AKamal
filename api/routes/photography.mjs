import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const DATA_FILE = path.join(PROJECT_ROOT, "data", "photography.json");

/**
 * Read and parse photography.json.
 */
export async function readData() {
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

/**
 * Write data back to photography.json with pretty formatting.
 */
export async function writeData(data) {
  const temporaryFile = `${DATA_FILE}.${process.pid}.${Date.now()}.tmp`;
  const serialized = JSON.stringify(data, null, 2) + "\n";

  try {
    // Write the complete document first, then replace the live file in one step.
    // This prevents Next.js from reading half-written JSON while it is watching
    // the portfolio data during development.
    await fs.writeFile(temporaryFile, serialized, "utf-8");
    await fs.rename(temporaryFile, DATA_FILE);
  } catch (error) {
    await fs.rm(temporaryFile, { force: true }).catch(() => {});
    throw error;
  }
}

/**
 * Find a collection by slug across both primary and archive lists.
 * Returns { collection, list, index } or null.
 */
export function findCollection(data, slug) {
  for (const listName of ["primaryCollections", "archiveCollections"]) {
    const list = data[listName];
    const index = list.findIndex((c) => c.slug === slug);
    if (index !== -1) {
      return { collection: list[index], list, index };
    }
  }
  return null;
}
