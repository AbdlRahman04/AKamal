import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateArchitecture } from "./architecture-schema.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "data", "dev.json");
const data = JSON.parse(await fs.readFile(file, "utf8"));
const errors = [];

for (const field of ["name", "title", "intro", "location", "email", "availability"]) {
  if (!data.profile?.[field]) errors.push(`profile.${field} is required`);
}
if (!Array.isArray(data.profile?.links)) errors.push("profile.links must be an array");

for (const [collection, required] of Object.entries({
  skills: ["name", "description", "items"],
  projects: ["title", "summary", "problem", "solution", "technologies", "stackBreakdown", "highlights"],
  journey: ["period", "title", "description"],
  experience: ["company", "role", "period", "summary", "technologies"],
  certificates: ["name", "issuer", "year", "status"],
  toolkits: ["name", "category"],
  education: ["degree", "institution", "period"],
})) {
  if (!Array.isArray(data[collection])) {
    errors.push(`${collection} must be an array`);
    continue;
  }

  const slugs = new Set();
  for (const [index, item] of data[collection].entries()) {
    if (!item.slug) errors.push(`${collection}[${index}].slug is required`);
    if (slugs.has(item.slug)) errors.push(`${collection}[${index}].slug is duplicated: ${item.slug}`);
    slugs.add(item.slug);
    for (const field of required) {
      const expectsArray = ["items", "technologies", "stackBreakdown", "highlights"].includes(field);
      if (expectsArray ? !Array.isArray(item[field]) : !item[field]) {
        errors.push(`${collection}[${index}].${field} is required`);
      }
    }
  }
}

for (const [index, project] of (data.projects || []).entries()) {
  if (project.architecture !== undefined) errors.push(...validateArchitecture(project.architecture).map(error => `projects[${index}].architecture: ${error}`));
  for (const field of ["role", "frontend", "backend", "database", "deployment", "contribution", "keyFeature", "technicalChallenge"]) {
    if (project[field] !== undefined && typeof project[field] !== "string") errors.push(`projects[${index}].${field} must be a string`);
  }
  if (project.teamSize !== undefined && (!Number.isInteger(project.teamSize) || project.teamSize <= 0)) {
    errors.push(`projects[${index}].teamSize must be a positive integer`);
  }
  if (project.caseStudy) {
    const study = project.caseStudy;
    if (!study.description || !study.architectureDescription || !study.deploymentLabel || !study.nodes || !Array.isArray(study.technologies) || !Array.isArray(study.features) || !Array.isArray(study.flow)) errors.push(`projects[${index}].caseStudy is incomplete`);
    for (const key of ["customer", "staff", "frontend", "backend", "database", "payment"]) {
      if (!study.nodes?.[key]?.title || !Array.isArray(study.nodes?.[key]?.lines)) errors.push(`projects[${index}].caseStudy.nodes.${key} is incomplete`);
    }
  }
  if (Array.isArray(project.stackBreakdown) && (!project.stackBreakdown.length || project.stackBreakdown.some((line) => typeof line !== "string" || !line.trim()))) {
    errors.push(`projects[${index}].stackBreakdown needs at least one non-empty line`);
  }
}

for (const [index, link] of (data.profile?.links || []).entries()) {
  if (!link.label || !link.href) errors.push(`profile.links[${index}] needs label and href`);
  if (link.href && !/^https?:\/\//.test(link.href) && !/^mailto:/.test(link.href)) errors.push(`profile.links[${index}].href must be http(s) or mailto`);
}

for (const collection of ["projects", "certificates", "toolkits", "education"]) {
  const urlFields = collection === "projects" ? ["githubUrl", "liveUrl", "coverImageUrl"] : collection === "certificates" ? ["credentialUrl", "imageUrl"] : collection === "education" ? ["imageUrl"] : ["url"];
  for (const [index, item] of (data[collection] || []).entries()) {
    for (const field of urlFields) {
      if (item[field] && !/^(https?:\/\/|\/)/.test(item[field])) errors.push(`${collection}[${index}].${field} must be an http(s) URL or site path`);
    }
  }
}

for (const [index, certificate] of (data.certificates || []).entries()) {
  if (!["completed", "in-progress"].includes(certificate.status)) {
    errors.push(`certificates[${index}].status must be completed or in-progress`);
  }
}

if (errors.length) {
  console.error("Dev portfolio validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Dev portfolio is valid (${data.projects.length} project${data.projects.length === 1 ? "" : "s"}).`);
