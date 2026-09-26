import fs from "node:fs/promises";
import path from "node:path";
import { AzureOpenAI } from "openai";
import { PROJECT_ROOT } from "./photography.mjs";
import { preprocessImageToDataUrl } from "./image-preprocess.mjs";
import { loadPrompt } from "./prompt-loader.mjs";
import { recordLlmUsage } from "../usage-log.mjs";
import {
  validateCollectionSuggestion,
  validatePhotoSuggestion,
  validateProfileBatchSuggestion,
  validateProfileDraft,
} from "../schemas/suggestion.mjs";

const MAX_COLLECTION_IMAGES = 12;
const PROFILE_BATCH_SIZE = 8;

export const MAX_PHOTO_TAGS = 6;
export const MAX_AI_TAGS = 4;

export const TECHNIQUE_TAGS = [
  "Panning", "Motion Blur", "Shutter Speed", "Environmental Texture",
  "Golden Hour", "Exposure Balance", "Color Grading", "Atmospheric Light",
  "Rule of Thirds", "Leading Lines", "Environmental Framing", "Depth",
  "Visual Balance", "Staging", "Window Light", "Reflection Control",
  "Symmetry", "Detail Macro", "Lifestyle", "Candid", "Day-to-Dusk",
];

export function normalizePhotoTags(tags) {
  return Array.isArray(tags)
    ? [...new Set(tags.filter((tag) => TECHNIQUE_TAGS.includes(tag)))].slice(0, MAX_PHOTO_TAGS)
    : [];
}

const PHOTO_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string", description: "A concise portfolio title." },
    alt: { type: "string", description: "Concise, accessible image alt text." },
    story: { type: "string", description: "A concise, professional visual description in one or two sentences." },
    tags: { type: "array", maxItems: MAX_AI_TAGS, items: { type: "string", enum: TECHNIQUE_TAGS } },
  },
  required: ["title", "alt", "story", "tags"],
};

const COLLECTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string", description: "A concise portfolio collection title." },
    theme: { type: "string", description: "A concise statement of the visual theme." },
    intro: { type: "string", description: "A concise portfolio introduction based only on the images." },
    skillsDemonstrated: { type: "string", description: "A concise list or sentence describing visible photography skills." },
    suggestedSection: { type: "string", enum: ["primary", "archive"] },
  },
  required: ["title", "theme", "intro", "skillsDemonstrated", "suggestedSection"],
};

const PROFILE_BATCH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    visualThemes: { type: "array", maxItems: 8, items: { type: "string" } },
    compositionAndLight: { type: "string" },
    subjectsAndAtmosphere: { type: "string" },
    storytelling: { type: "string" },
    evolutionSignals: { type: "array", maxItems: 6, items: { type: "string" } },
  },
  required: ["visualThemes", "compositionAndLight", "subjectsAndAtmosphere", "storytelling", "evolutionSignals"],
};

const PROFILE_DRAFT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    intro: { type: "string" },
    about: { type: "string" },
    visualThemes: { type: "array", maxItems: 8, items: { type: "string" } },
  },
  required: ["intro", "about", "visualThemes"],
};

const PHOTO_FALLBACK_PROMPT = [
  "You generate draft metadata for a photographer's portfolio.",
  "Describe only visual characteristics reasonably observable in the image.",
  "Do not invent a location, date, identity, event, camera settings, or backstory.",
  "Use professional, specific, restrained language; avoid generic promotional phrases.",
  "Keep title and alt text concise. Keep story to one or two sentences.",
  `Suggest no more than ${MAX_AI_TAGS} of the strongest, most specific technique tags. Avoid tag saturation; omit weak or redundant tags.`,
  "Return only valid JSON matching the supplied photo_metadata schema. Do not use Markdown fences.",
].join(" ");

const COLLECTION_FALLBACK_PROMPT = [
  "You generate draft metadata for a photographer's portfolio collection.",
  "Use only visual patterns shared by the supplied images.",
  "Do not invent a location, date, identity, client, event, or photographer intention.",
  "Write concise, professional portfolio copy that is specific rather than promotional.",
  "Suggest primary for a polished portfolio body of work and archive for an exploratory or secondary set.",
  "Return only valid JSON matching the supplied collection_metadata schema. Do not use Markdown fences.",
].join(" ");

const PROFILE_CONTEXT = [
  "The photographer started photography in 2019.",
  "At first, the photographer made mistakes and often made casual horizontal images from roughly 45-degree angles.",
  "Through practice and photography education, including studying how effective photographs are made, the photographer became more deliberate about composition, light, atmosphere, and subject placement.",
  "Today, the photographer reads the atmosphere, matches it with a subject, and aims to create an image that carries its own story instead of relying on the photographer to explain it.",
].join(" ");

const PROFILE_BATCH_FALLBACK_PROMPT = [
  "You analyze a batch of photographs to identify a photographer's recurring visual language.",
  "Describe only visual patterns that are reasonably observable in the supplied images.",
  "Do not invent locations, dates, clients, equipment, identity, or personal history from the images.",
  "Use specific, restrained language about composition, light, color, atmosphere, subjects, motion, and storytelling.",
  "Return only valid JSON matching the supplied profile_batch schema. Do not use Markdown fences.",
].join(" ");

const PROFILE_DRAFT_FALLBACK_PROMPT = [
  "You write concise, personal portfolio copy for a photographer.",
  "Use the supplied visual observations and the photographer's provided background as the only sources.",
  "Do not invent locations, dates, clients, equipment, credentials, or personal history.",
  "Write in first person with a thoughtful, grounded voice. Avoid generic claims such as 'I capture moments' or 'passion for photography'.",
  "The intro should be one concise sentence. The about should be one polished paragraph of roughly 110 to 160 words, suitable for a portfolio page.",
  "Return only valid JSON matching the supplied profile_draft schema. Do not use Markdown fences.",
].join(" ");

class AiServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "AiServiceError";
    this.statusCode = statusCode;
  }
}

class SuggestionValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "SuggestionValidationError";
  }
}

function numberSetting(name, fallback, { integer = false, minimum = 0 } = {}) {
  const value = Number(process.env[name]);
  if (!Number.isFinite(value) || value < minimum) return fallback;
  return integer ? Math.floor(value) : value;
}

function max429Retries() {
  const raw = process.env.LLM_MAX_429_RETRIES;
  if (raw === "") return Infinity;
  return numberSetting("LLM_MAX_429_RETRIES", 4, { integer: true });
}

function getSettings() {
  return {
    maxRetries: numberSetting("LLM_MAX_RETRIES", 4, { integer: true }),
    baseDelaySeconds: numberSetting("LLM_BASE_DELAY_SECONDS", 2),
    max429Retries: max429Retries(),
    max429BackoffSeconds: numberSetting("LLM_MAX_429_BACKOFF_SECONDS", 60),
    defaultMaxTokens: numberSetting("LLM_DEFAULT_MAX_TOKENS", 2048, { integer: true, minimum: 1 }),
    defaultTemperature: numberSetting("LLM_DEFAULT_TEMPERATURE", 0.3),
    connectTimeoutMs: numberSetting("LLM_TIMEOUT_CONNECT_MS", 10_000, { integer: true, minimum: 1 }),
    readTimeoutMs: numberSetting("LLM_TIMEOUT_READ_MS", 90_000, { integer: true, minimum: 1 }),
    imageMaxPixels: numberSetting("IMAGE_MAX_PIXELS", 4_000_000, { integer: true, minimum: 1 }),
    imageJpegQuality: numberSetting("IMAGE_JPEG_QUALITY", 85, { integer: true, minimum: 1 }),
    visionMaxTokens: numberSetting("VISION_MAX_TOKENS", 1024, { integer: true, minimum: 1 }),
  };
}

function configured(value, placeholder) {
  return Boolean(value && !value.toLowerCase().includes(placeholder));
}

function getAzureConfig() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT || process.env.LLM_BASE_URL;
  const apiKey = process.env.AZURE_OPENAI_API_KEY || process.env.LLM_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || process.env.LLM_MODEL;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION;

  if (!configured(endpoint, "your-resource") || !configured(apiKey, "replace-with") || !configured(deployment, "your-deployment") || !configured(apiVersion, "your-supported")) {
    throw new AiServiceError("Azure OpenAI is not configured. Add the Azure settings to .env or .env.local.", 503);
  }
  return { endpoint, apiKey, deployment, apiVersion };
}

function getClient() {
  const azure = getAzureConfig();
  const settings = getSettings();
  return {
    ...azure,
    settings,
    client: new AzureOpenAI({
      endpoint: azure.endpoint,
      apiKey: azure.apiKey,
      apiVersion: azure.apiVersion,
      deployment: azure.deployment,
      // The SDK exposes one request timeout; use the larger read timeout while
      // retaining the separate connect setting in the documented config surface.
      timeout: Math.max(settings.connectTimeoutMs, settings.readTimeoutMs),
      maxRetries: 0,
    }),
  };
}

export function getAiStatus() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT || process.env.LLM_BASE_URL || "";
  const apiKey = process.env.AZURE_OPENAI_API_KEY || process.env.LLM_API_KEY || "";
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || process.env.LLM_MODEL || "";
  const settings = getSettings();
  let endpointHost = "";
  try { endpointHost = new URL(endpoint).host; } catch { /* invalid/missing endpoint is reported as not configured */ }
  return {
    configured: configured(endpoint, "your-resource") && configured(apiKey, "replace-with") && configured(deployment, "your-deployment") && configured(process.env.AZURE_OPENAI_API_VERSION || "", "your-supported"),
    provider: "Azure OpenAI",
    deployment: deployment || "Not configured",
    endpointHost: endpointHost || "Not configured",
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || "Not configured",
    retries: settings.maxRetries,
    imageMaxPixels: settings.imageMaxPixels,
    imageJpegQuality: settings.imageJpegQuality,
    visionMaxTokens: settings.visionMaxTokens,
    prompts: process.env.PROMPTS_DIR ? "External directory" : "Project prompts/",
    usageLog: process.env.USAGE_LOG_PATH || "logs/llm_usage.jsonl",
  };
}

function imagePathFromUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") throw new AiServiceError("The selected photo does not have an image file.", 400);
  const filename = path.basename(imageUrl);
  if (!filename || filename !== imageUrl.split("/").pop()) throw new AiServiceError("The selected image path is invalid.", 400);
  const folder = imageUrl.includes("/thumbs/") ? "thumbs" : "full";
  return path.join(PROJECT_ROOT, "public", "photography", folder, filename);
}

async function imagePart(imageUrl) {
  const filePath = imagePathFromUrl(imageUrl);
  let buffer;
  try { buffer = await fs.readFile(filePath); } catch { throw new AiServiceError("The stored image could not be read for analysis.", 404); }
  const settings = getSettings();
  let image;
  try {
    image = await preprocessImageToDataUrl(buffer, { maxPixels: settings.imageMaxPixels, quality: settings.imageJpegQuality });
  } catch { throw new AiServiceError("The stored image could not be prepared for analysis.", 422); }
  return { type: "image_url", image_url: { url: image.dataUrl, detail: "low" } };
}

function textPart(text) { return { type: "text", text }; }

function usesReasoningModel(deployment) {
  return /(^|[-_])(gpt-5(?:[.-]|$)|o1(?:[.-]|$)|o3(?:[.-]|$)|o4(?:[.-]|$))/i.test(deployment);
}

function errorStatus(error) { return Number(error?.status || error?.statusCode || 0); }
function isRetryable(error) {
  const status = errorStatus(error);
  return status === 429 || status >= 500 || ["ECONNRESET", "ETIMEDOUT", "EAI_AGAIN", "ENETUNREACH"].includes(error?.code);
}
function isRateLimited(error) { return errorStatus(error) === 429; }
function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function retryDelayMs(attempt, rateLimited, settings) {
  const exponential = settings.baseDelaySeconds * 1000 * (2 ** attempt);
  const cap = rateLimited ? settings.max429BackoffSeconds * 1000 : 30_000;
  return Math.min(exponential, cap);
}

async function requestCompletion(messages, schema, kind) {
  const { client, deployment, settings } = getClient();
  const reasoningModel = usesReasoningModel(deployment);
  const request = {
    model: deployment,
    messages,
    ...(reasoningModel
      ? { max_completion_tokens: kind === "photo" ? settings.visionMaxTokens : settings.defaultMaxTokens }
      : {
          temperature: settings.defaultTemperature,
          max_tokens: kind === "photo" ? settings.visionMaxTokens : settings.defaultMaxTokens,
        }),
    response_format: {
      type: "json_schema",
      json_schema: {
        name: kind === "photo" ? "photo_metadata" : kind === "collection" ? "collection_metadata" : profileSchemaName(kind),
        strict: true,
        schema,
      },
    },
  };

  let fallbackJsonModeUsed = false;
  let retryCount = 0;
  let rateLimitCount = 0;
  while (true) {
    const started = Date.now();
    try {
      const response = await client.chat.completions.create(request);
      const usage = response.usage || {};
      await recordLlmUsage({ model: deployment, callKind: kind, promptTokens: usage.prompt_tokens, completionTokens: usage.completion_tokens, totalTokens: usage.total_tokens, usageReported: Boolean(response.usage), latencyMs: Date.now() - started, status: "ok" });
      return response;
    } catch (error) {
      const status = errorStatus(error);
      if (status === 400 && !fallbackJsonModeUsed && request.response_format?.type === "json_schema") {
        request.response_format = { type: "json_object" };
        fallbackJsonModeUsed = true;
        continue;
      }
      if (!isRetryable(error) || retryCount >= settings.maxRetries || (isRateLimited(error) && rateLimitCount >= settings.max429Retries)) {
        await recordLlmUsage({ model: deployment, callKind: kind, latencyMs: Date.now() - started, status: `error_${status || "network"}` });
        console.error("Azure OpenAI request failed:", error?.message || error);
        throw new AiServiceError("Azure OpenAI could not analyze the image right now.", 502);
      }
      retryCount++;
      if (isRateLimited(error)) rateLimitCount++;
      await wait(retryDelayMs(retryCount - 1, isRateLimited(error), settings));
    }
  }
}

function repairJsonText(content) {
  let candidate = String(content || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start >= 0 && end > start) candidate = candidate.slice(start, end + 1);
  try { JSON.parse(candidate); return candidate; } catch { /* apply small, safe repairs below */ }
  return candidate.replace(/,\s*([}\]])/g, "$1").replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":');
}

function parseAndValidate(content, kind) {
  if (!content) throw new SuggestionValidationError("no JSON content");
  let parsed;
  try { parsed = JSON.parse(repairJsonText(content)); } catch { throw new SuggestionValidationError("invalid JSON"); }
  const checked = kind === "photo"
    ? validatePhotoSuggestion(parsed, TECHNIQUE_TAGS, MAX_AI_TAGS)
    : kind === "collection"
      ? validateCollectionSuggestion(parsed)
      : kind === "profileBatch"
        ? validateProfileBatchSuggestion(parsed)
        : validateProfileDraft(parsed);
  if (!checked.success) throw new SuggestionValidationError(checked.errors.map((item) => `${item.path}: ${item.message}`).join("; "));
  return checked.data;
}

async function requestStructuredMetadata(messages, schema, kind) {
  let currentMessages = messages;
  let validationError = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await requestCompletion(currentMessages, schema, kind);
    const message = response.choices?.[0]?.message;
    if (message?.refusal) throw new AiServiceError("Azure OpenAI declined to analyze this image.", 422);
    try { return parseAndValidate(message?.content, kind); } catch (error) {
      validationError = error;
      if (attempt === 0) currentMessages = [...messages, { role: "user", content: `Return corrected JSON only. Validation errors: ${error.message}` }];
    }
  }
  throw new AiServiceError(`Azure OpenAI returned invalid metadata: ${validationError?.message || "unknown validation error"}.`, 502);
}

export async function analyzePhoto(collection, photoId) {
  const photo = collection.photos.find((item) => item.id === photoId);
  if (!photo) throw new AiServiceError("Photo not found.", 404);
  if (photo.isPlaceholder || (!photo.src && !photo.thumbnailSrc)) throw new AiServiceError("This photo does not contain an image to analyze.", 400);
  const image = await imagePart(photo.src || photo.thumbnailSrc);
  const existingTags = normalizePhotoTags(photo.tags);
  const instructions = `${loadPrompt("photography_suggest", PHOTO_FALLBACK_PROMPT)} Choose only relevant technique tags from this exact list: ${TECHNIQUE_TAGS.join(", ")}. Return no more than ${MAX_AI_TAGS} tags, prioritizing complementary tags that are not already selected. The dashboard will keep the existing tags and add these suggestions up to ${MAX_PHOTO_TAGS} total.`;
  return requestStructuredMetadata([
    { role: "system", content: instructions },
    { role: "user", content: [textPart(`Analyze this photograph and return photo_metadata JSON. Existing selected tags to preserve: ${existingTags.length ? existingTags.join(", ") : "none"}.`), image] },
  ], PHOTO_SCHEMA, "photo");
}

export async function analyzeCollection(collection) {
  const limit = numberSetting("MAX_COLLECTION_IMAGES", MAX_COLLECTION_IMAGES, { integer: true, minimum: 1 });
  const photos = collection.photos.filter((photo) => !photo.isPlaceholder && (photo.thumbnailSrc || photo.src)).slice(0, limit);
  if (!photos.length) throw new AiServiceError("Upload at least one image before analyzing the collection.", 400);
  const images = await Promise.all(photos.map((photo) => imagePart(photo.thumbnailSrc || photo.src)));
  return requestStructuredMetadata([
    { role: "system", content: loadPrompt("collection_suggest", COLLECTION_FALLBACK_PROMPT) },
    { role: "user", content: [textPart(`Analyze these ${images.length} photography images and return collection_metadata JSON.`), ...images] },
  ], COLLECTION_SCHEMA, "collection");
}

function profileSchemaName(kind) {
  return kind === "profileBatch" ? "profile_batch" : "profile_draft";
}

function profileTextPart(text) { return { type: "text", text }; }

export async function analyzePortfolioProfile(data) {
  const collections = [...(data?.primaryCollections || []), ...(data?.archiveCollections || [])];
  const photos = collections.flatMap((collection) => collection.photos
    .filter((photo) => !photo.isPlaceholder && (photo.src || photo.thumbnailSrc))
    .map((photo) => ({ collection: collection.title, photo })));

  if (!photos.length) throw new AiServiceError("Upload at least one image before analyzing the portfolio.", 400);

  const observations = [];
  for (let index = 0; index < photos.length; index += PROFILE_BATCH_SIZE) {
    const batch = photos.slice(index, index + PROFILE_BATCH_SIZE);
    const images = await Promise.all(batch.map(({ photo }) => imagePart(photo.src || photo.thumbnailSrc)));
    const batchContext = batch.map(({ collection, photo }, itemIndex) => `${itemIndex + 1}. Collection: ${collection}; title: ${photo.title || "Untitled"}`).join("\n");
    const observation = await requestStructuredMetadata([
      { role: "system", content: PROFILE_BATCH_FALLBACK_PROMPT },
      {
        role: "user",
        content: [
          profileTextPart(`Analyze this batch of ${batch.length} photographs. The image index and collection context are below:\n${batchContext}`),
          ...images,
        ],
      },
    ], PROFILE_BATCH_SCHEMA, "profileBatch");
    observations.push(observation);
  }

  const synthesisInput = JSON.stringify({
    photographerContext: PROFILE_CONTEXT,
    batchObservations: observations,
  });
  const draft = await requestStructuredMetadata([
    { role: "system", content: PROFILE_DRAFT_FALLBACK_PROMPT },
    { role: "user", content: profileTextPart(`Create an About draft from this photographer context and the complete set of batch observations.\n${synthesisInput}`) },
  ], PROFILE_DRAFT_SCHEMA, "profileDraft");

  return {
    ...draft,
    analyzedImages: photos.length,
    batchCount: observations.length,
  };
}
