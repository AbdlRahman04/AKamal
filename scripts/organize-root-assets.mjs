import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const knownCertificates = new Set(["screenshot_1.webp"]);

function destination(name) {
  if (/\.pdf$/i.test(name)) return "assets/pdfs";
  if (/\.(?:jpe?g|png|webp|avif|gif|tiff?|bmp|svg)$/i.test(name)
    && (/(?:certificat(?:e|ion)|coursera)/i.test(name) || knownCertificates.has(name.toLowerCase()))) {
    return "assets/certificates";
  }
  return null;
}

// Linking before unlinking is an atomic, no-overwrite move on the same volume.
// Duplicate filenames receive a suffix, preserving both files.
async function move(source, directory, name) {
  await fs.mkdir(directory, { recursive: true });
  const extension = path.extname(name);
  const stem = path.basename(name, extension);
  for (let index = 0; ; index++) {
    const target = path.join(directory, index ? `${stem} (${index})${extension}` : name);
    try {
      await fs.link(source, target);
    } catch (error) {
      if (error.code === "EEXIST") continue;
      throw error;
    }
    try {
      await fs.unlink(source);
    } catch (error) {
      await fs.unlink(target);
      throw error;
    }
    console.log(`Organized ${name} -> ${path.relative(root, target)}`);
    return;
  }
}

const previous = new Map();
async function scan(waitForCopy = false) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const present = new Set();
  for (const entry of entries) {
    const folder = destination(entry.name);
    if (!entry.isFile() || !folder) continue;
    present.add(entry.name);
    const source = path.join(root, entry.name);
    try {
      const stat = await fs.stat(source);
      const signature = `${stat.size}:${stat.mtimeMs}:${stat.ctimeMs}`;
      const last = previous.get(entry.name);
      previous.set(entry.name, { signature, since: last?.signature === signature ? last.since : Date.now() });
      // Require two seconds without changes before moving a newly copied file.
      if (waitForCopy && (!last || last.signature !== signature || Date.now() - last.since < 2000)) continue;
      await move(source, path.join(root, folder), entry.name);
      previous.delete(entry.name);
    } catch (error) {
      if (error.code === "ENOENT") continue;
      console.error(`Could not organize ${entry.name}: ${error.message}`);
      if (!waitForCopy) process.exitCode = 1;
    }
  }
  for (const name of previous.keys()) if (!present.has(name)) previous.delete(name);
}

const args = process.argv.slice(2);
const withDev = args.includes("--dev");
const watching = withDev || args.includes("--watch");
await scan(watching);

if (watching) {
  console.log("Watching project root for PDFs and certificate images.");
  let scanning = false;
  const timer = setInterval(async () => {
    if (scanning) return;
    scanning = true;
    try { await scan(true); }
    catch (error) { console.error(`Asset organizer: ${error.message}`); }
    finally { scanning = false; }
  }, 1000);

  const dev = withDev ? spawn(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "dev", ...args.filter(arg => arg !== "--dev")], { cwd: root, stdio: "inherit" }) : null;
  function stop(signal) {
    clearInterval(timer);
    if (dev) dev.kill(signal);
  }
  process.on("SIGINT", () => stop("SIGINT"));
  process.on("SIGTERM", () => stop("SIGTERM"));
  dev?.on("error", error => {
    clearInterval(timer);
    console.error(`Could not start Next.js: ${error.message}`);
    process.exitCode = 1;
  });
  dev?.on("exit", (code, signal) => {
    clearInterval(timer);
    process.exitCode = signal === "SIGINT" || signal === "SIGTERM" ? 0 : code ?? 1;
  });
}
