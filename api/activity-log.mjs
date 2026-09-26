import fs from "node:fs/promises";
import path from "node:path";
import { PROJECT_ROOT } from "./routes/photography.mjs";

const ACTIVITY_LOG_PATH = path.join(PROJECT_ROOT, "logs", "admin_activity.jsonl");
const MAX_ACTIVITY_EVENTS = 500;
const DEFAULT_EVENT_LIMIT = 8;

let writeQueue = Promise.resolve();

function text(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : undefined;
}

function number(value) {
  return Number.isFinite(Number(value)) ? Number(value) : undefined;
}

function normalizeEvent(input = {}) {
  const kind = input.kind === "error" ? "error" : "audit";
  const status = input.status === "error" ? "error" : kind === "error" ? "error" : "success";
  const event = {
    timestamp: new Date().toISOString(),
    actor: "local-admin",
    kind,
    status,
    action: text(input.action, 80) || "admin.activity",
    collection: text(input.collection, 120),
    photo: text(input.photo, 160),
    message: text(input.message, 500) || (kind === "error" ? "Admin operation failed." : "Admin operation completed."),
  };

  const counts = input.counts && typeof input.counts === "object" ? {} : null;
  if (counts) {
    for (const [key, value] of Object.entries(input.counts)) {
      const safeKey = text(key, 40);
      const safeValue = number(value);
      if (safeKey && safeValue !== undefined) counts[safeKey] = safeValue;
    }
    if (Object.keys(counts).length) event.counts = counts;
  }

  return Object.fromEntries(Object.entries(event).filter(([, value]) => value !== undefined));
}

async function readEvents() {
  try {
    const raw = await fs.readFile(ACTIVITY_LOG_PATH, "utf8");
    return raw.split(/\r?\n/).filter(Boolean).flatMap((line) => {
      try {
        const value = JSON.parse(line);
        return value && typeof value === "object" ? [value] : [];
      } catch {
        return [];
      }
    }).slice(-MAX_ACTIVITY_EVENTS);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export async function recordActivity(input) {
  const event = normalizeEvent(input);
  writeQueue = writeQueue.then(async () => {
    try {
      await fs.mkdir(path.dirname(ACTIVITY_LOG_PATH), { recursive: true });
      const events = await readEvents();
      events.push(event);
      await fs.writeFile(
        ACTIVITY_LOG_PATH,
        `${events.slice(-MAX_ACTIVITY_EVENTS).map((item) => JSON.stringify(item)).join("\n")}\n`,
        "utf8",
      );
    } catch (error) {
      console.warn(`[activity] Could not write activity log: ${error.message}`);
    }
  });
  return writeQueue;
}

export async function getActivity(limit = DEFAULT_EVENT_LIMIT) {
  const safeLimit = Math.min(Math.max(Number(limit) || DEFAULT_EVENT_LIMIT, 1), 50);
  const events = await readEvents();
  const errors = events.filter((event) => event.kind === "error").length;
  const audits = events.filter((event) => event.kind === "audit").length;

  return {
    events: events.slice(-safeLimit).reverse(),
    summary: {
      status: errors ? "error" : "healthy",
      errorCount: errors,
      auditCount: audits,
      totalCount: events.length,
    },
  };
}
