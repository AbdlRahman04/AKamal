import fs from "node:fs/promises";
import path from "node:path";
import { PROJECT_ROOT } from "./photography.mjs";

let saveQueue = Promise.resolve();

function invalid(message) {
  return Object.assign(new Error(message), { statusCode: 400 });
}

export function normalizeAiConfiguration(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw invalid("Provide the OpenAI settings.");
  const endpoint = typeof input.endpoint === "string" ? input.endpoint.trim() : "";
  if (endpoint.length > 2048) throw invalid("The endpoint URL is too long.");
  let url;
  try { url = new URL(endpoint); } catch { throw invalid("Enter a valid HTTPS endpoint URL."); }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
    throw invalid("The endpoint must use HTTPS without credentials, a query, or a fragment.");
  }
  const deployment = typeof input.deployment === "string" ? input.deployment.trim() : "";
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(deployment)) {
    throw invalid("Enter a deployment name using letters, numbers, dots, hyphens, or underscores.");
  }
  const apiVersion = typeof input.apiVersion === "string" ? input.apiVersion.trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}(?:-preview)?$/.test(apiVersion)) {
    throw invalid("Enter an API version such as YYYY-MM-DD or YYYY-MM-DD-preview.");
  }
  const apiKey = typeof input.apiKey === "string" ? input.apiKey.trim() : "";
  if (apiKey.length > 2048 || /[\s"']/.test(apiKey)) throw invalid("The API key cannot contain spaces or quotes.");
  const updates = {
    AZURE_OPENAI_ENDPOINT: url.href,
    AZURE_OPENAI_DEPLOYMENT: deployment,
    AZURE_OPENAI_API_VERSION: apiVersion,
  };
  if (apiKey) updates.AZURE_OPENAI_API_KEY = apiKey;
  return updates;
}

export function updateEnvContents(contents, updates) {
  const newline = contents.includes("\r\n") ? "\r\n" : "\n";
  const remaining = new Set(Object.keys(updates));
  const lines = contents.split(/\r?\n/).flatMap((line) => {
    const key = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=/)?.[1];
    if (!Object.prototype.hasOwnProperty.call(updates, key)) return [line];
    if (!remaining.has(key)) return [];
    remaining.delete(key);
    return [`${key}=${updates[key]}`];
  });
  while (lines.at(-1) === "") lines.pop();
  for (const key of remaining) lines.push(`${key}=${updates[key]}`);
  return `${lines.join(newline)}${newline}`;
}

/** Save only the supported Azure settings. Blank keys retain the existing secret. */
export function saveAiConfiguration(input) {
  const updates = normalizeAiConfiguration(input);
  const operation = saveQueue.then(async () => {
    const savedKey = process.env.AZURE_OPENAI_API_KEY || process.env.LLM_API_KEY || "";
    if (!updates.AZURE_OPENAI_API_KEY && (!savedKey || savedKey.toLowerCase().includes("replace-with"))) {
      throw invalid("Enter an API key to configure the service.");
    }
    const envPath = path.join(PROJECT_ROOT, ".env.local");
    const temporaryPath = `${envPath}.${process.pid}.tmp`;
    let contents = "";
    try { contents = await fs.readFile(envPath, "utf8"); } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    try {
      await fs.writeFile(temporaryPath, updateEnvContents(contents, updates), { encoding: "utf8", mode: 0o600 });
      await fs.rename(temporaryPath, envPath);
    } catch (error) {
      await fs.rm(temporaryPath, { force: true }).catch(() => {});
      throw error;
    }
    Object.assign(process.env, updates);
  });
  saveQueue = operation.catch(() => {});
  return operation;
}
