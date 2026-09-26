import fs from "node:fs";
import path from "node:path";

function usageLogPath() {
  return path.resolve(process.env.USAGE_LOG_PATH || path.join(process.cwd(), "logs", "llm_usage.jsonl"));
}

export async function recordLlmUsage(entry) {
  try {
    const row = {
      ts: new Date().toISOString(),
      model: entry.model || null,
      call_kind: entry.callKind || "chat",
      prompt_tokens: entry.promptTokens ?? null,
      completion_tokens: entry.completionTokens ?? null,
      total_tokens: entry.totalTokens ?? null,
      usage_reported: Boolean(entry.usageReported),
      latency_ms: entry.latencyMs ?? null,
      status: entry.status || "ok",
    };
    const file = usageLogPath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, `${JSON.stringify(row)}\n`, "utf8");
  } catch (error) {
    // Observability must never make an otherwise successful AI request fail.
    console.debug?.(`[usage] ${error.message}`);
  }
}
