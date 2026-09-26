import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function defaultPromptsDir() {
  return path.resolve(process.env.PROMPTS_DIR || path.join(__dirname, "..", "..", "prompts"));
}

export function loadPrompt(name, fallback = "", promptsDir = defaultPromptsDir()) {
  const base = String(name || "").replace(/\.(txt|md)$/i, "");
  for (const filename of [`${base}.txt`, `${base}.md`]) {
    const file = path.join(promptsDir, filename);
    try {
      const content = fs.readFileSync(file, "utf8").trim();
      if (content) return content;
    } catch (error) {
      if (error?.code !== "ENOENT") console.warn(`[prompts] ${file}: ${error.message}`);
    }
  }
  return fallback;
}

export function renderTemplate(template, vars = {}) {
  return String(template || "").replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key) => {
    let current = vars;
    for (const part of key.split(".")) {
      if (current == null || typeof current !== "object") return "";
      current = current[part];
    }
    return current == null ? "" : String(current);
  });
}
