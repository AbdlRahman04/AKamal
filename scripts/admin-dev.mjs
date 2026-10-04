import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = ["--watch", "--watch-preserve-output"];

// Explicit watch paths are supported by Node on Windows and macOS.
// Content, images, admin UI files, logs, and Next build output are not watched.
if (["win32", "darwin"].includes(process.platform)) {
  const paths = [
    "api",
    "scripts/image-presentation.mjs",
    "scripts/architecture-schema.mjs",
    ...[".env", ".env.local"].filter(file => existsSync(path.join(root, file))),
  ];
  args.push(...paths.map(file => `--watch-path=${path.join(root, file)}`));
}

args.push(path.join(root, "api/server.mjs"));
const watcher = spawn(process.execPath, args, { cwd: root, stdio: "inherit" });

// Ctrl+C reaches the native watcher through the shared terminal. Let it stop
// its server child before this launcher exits.
process.on("SIGINT", () => {});
process.on("SIGTERM", () => watcher.kill("SIGTERM"));
watcher.on("error", error => {
  console.error(`Could not start the admin watcher: ${error.message}`);
  process.exitCode = 1;
});
watcher.on("exit", (code, signal) => {
  process.exitCode = signal === "SIGINT" || signal === "SIGTERM" ? 0 : code ?? 1;
});
