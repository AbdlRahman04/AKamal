import fs from "node:fs/promises";
import path from "node:path";
import { PROJECT_ROOT } from "./photography.mjs";
import { validateArchitecture } from "../../scripts/architecture-schema.mjs";

export const DEV_DATA_FILE = path.join(PROJECT_ROOT, "data", "dev.json");
export const DEV_COLLECTIONS = new Set(["skills", "journey", "experience", "certificates", "toolkits", "education"]);

export async function readDevData() {
  const raw = await fs.readFile(DEV_DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

export async function writeDevData(data) {
  const temporaryFile = `${DEV_DATA_FILE}.${process.pid}.${Date.now()}.tmp`;
  const serialized = JSON.stringify(data, null, 2) + "\n";

  try {
    await fs.writeFile(temporaryFile, serialized, "utf-8");
    await fs.rename(temporaryFile, DEV_DATA_FILE);
  } catch (error) {
    await fs.rm(temporaryFile, { force: true }).catch(() => {});
    throw error;
  }
}

export function findDevProject(data, slug) {
  const index = data.projects.findIndex((project) => project.slug === slug);
  return index === -1 ? null : { project: data.projects[index], index };
}

export function slugifyDevTitle(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function normalizeDevProject(input, fallback = {}) {
  const project = { ...fallback, ...input };
  const architecture = project.architecture ?? null;
  if (architecture !== null) {
    const errors = validateArchitecture(architecture);
    if (errors.length) throw new Error(`Invalid architecture: ${errors.join("; ")}`);
  }
  const caseStudy = project.caseStudy && typeof project.caseStudy === "object" ? project.caseStudy : null;
  return {
    slug: slugifyDevTitle(project.slug || project.title),
    number: String(project.number || "01"),
    title: String(project.title || "Untitled project").trim(),
    type: String(project.type || "Software project").trim(),
    year: String(project.year || new Date().getFullYear()).trim(),
    status: String(project.status || "Draft").trim(),
    summary: String(project.summary || "").trim(),
    problem: String(project.problem || "").trim(),
    solution: String(project.solution || "").trim(),
    technologies: Array.isArray(project.technologies) ? project.technologies.map(String).map((item) => item.trim()).filter(Boolean) : [],
    ...Object.fromEntries(["role", "frontend", "backend", "database", "deployment", "contribution", "keyFeature", "technicalChallenge"].map((field) => [field, String(project[field] ?? "").trim()])),
    teamSize: Number.isInteger(Number(project.teamSize)) && Number(project.teamSize) > 0 ? Number(project.teamSize) : undefined,
    stackBreakdown: Array.isArray(project.stackBreakdown) ? project.stackBreakdown.map(String).map((item) => item.trim()).filter(Boolean) : [],
    highlights: Array.isArray(project.highlights) ? project.highlights.map(String).map((item) => item.trim()).filter(Boolean) : [],
    githubUrl: String(project.githubUrl || "").trim(),
    liveUrl: String(project.liveUrl || "").trim(),
    featured: Boolean(project.featured),
    coverImageUrl: String(project.coverImageUrl || "").trim(),
    accent: String(project.accent || "").trim(),
    ...(caseStudy ? { caseStudy } : {}),
    ...(architecture ? { architecture } : {}),
  };
}

export function findDevCollectionItem(data, collection, slug) {
  const items = Array.isArray(data[collection]) ? data[collection] : [];
  const index = items.findIndex((item) => item.slug === slug);
  return index === -1 ? null : { item: items[index], index };
}

function stringList(value) {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : [];
}

function numberedRecord(input, fallback, title, defaults = {}) {
  const record = { ...fallback, ...input };
  return {
    ...defaults,
    slug: slugifyDevTitle(record.slug || title),
    number: String(record.number || "01").padStart(2, "0"),
  };
}

export function normalizeDevCollectionItem(collection, input, fallback = {}) {
  if (!DEV_COLLECTIONS.has(collection)) throw new Error(`Unsupported dev collection: ${collection}`);
  const record = { ...fallback, ...input };

  if (collection === "skills") {
    return {
      ...numberedRecord(record, fallback, record.name, { name: "Capability", description: "", items: [] }),
      name: String(record.name || "Capability").trim(),
      description: String(record.description || "").trim(),
      items: stringList(record.items),
    };
  }

  if (collection === "journey") {
    return {
      slug: slugifyDevTitle(record.slug || record.title),
      period: String(record.period || "Now").trim(),
      title: String(record.title || "New focus").trim(),
      description: String(record.description || "").trim(),
    };
  }

  if (collection === "experience") {
    return {
      ...numberedRecord(record, fallback, `${record.company || ""} ${record.role || ""}`, { company: "", role: "Role", period: "", summary: "", technologies: [], current: false }),
      company: String(record.company || "").trim(),
      role: String(record.role || "Role").trim(),
      period: String(record.period || "").trim(),
      summary: String(record.summary || "").trim(),
      technologies: stringList(record.technologies),
      current: Boolean(record.current),
    };
  }

  if (collection === "certificates") {
    return {
      ...numberedRecord(record, fallback, record.name, { name: "Certificate", issuer: "", year: "", description: "", status: "in-progress", credentialUrl: "", imageUrl: "" }),
      name: String(record.name || "Certificate").trim(),
      issuer: String(record.issuer || "").trim(),
      year: String(record.year || "").trim(),
      description: String(record.description || "").trim(),
      status: record.status === "completed" ? "completed" : "in-progress",
      credentialUrl: String(record.credentialUrl || "").trim(),
      imageUrl: String(record.imageUrl || "").trim(),
    };
  }

  if (collection === "toolkits") {
    return {
      ...numberedRecord(record, fallback, record.name, { name: "Tool", category: "", description: "", url: "" }),
      name: String(record.name || "Tool").trim(),
      category: String(record.category || "").trim(),
      description: String(record.description || "").trim(),
      url: String(record.url || "").trim(),
    };
  }

  return {
    ...numberedRecord(record, fallback, `${record.degree || ""} ${record.institution || ""}`, { degree: "Education", institution: "", period: "", description: "", focus: [] }),
    degree: String(record.degree || "Education").trim(),
    institution: String(record.institution || "").trim(),
    period: String(record.period || "").trim(),
    description: String(record.description || "").trim(),
    focus: stringList(record.focus),
  };
}
