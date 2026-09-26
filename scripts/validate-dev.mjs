import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
  projects: ["title", "summary", "problem", "solution", "technologies", "highlights"],
  journey: ["period", "title", "description"],
  experience: ["company", "role", "period", "summary", "technologies"],
  certificates: ["name", "issuer", "year"],
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
      const expectsArray = ["items", "technologies", "highlights"].includes(field);
      if (expectsArray ? !Array.isArray(item[field]) : !item[field]) {
        errors.push(`${collection}[${index}].${field} is required`);
      }
    }
  }
}

for (const [index, link] of (data.profile?.links || []).entries()) {
  if (!link.label || !link.href) errors.push(`profile.links[${index}] needs label and href`);
  if (link.href && !/^https?:\/\//.test(link.href) && !/^mailto:/.test(link.href)) errors.push(`profile.links[${index}].href must be http(s) or mailto`);
}

for (const collection of ["projects", "certificates", "toolkits"]) {
  const urlFields = collection === "projects" ? ["githubUrl", "liveUrl", "coverImageUrl"] : collection === "certificates" ? ["credentialUrl", "imageUrl"] : ["url"];
  for (const [index, item] of (data[collection] || []).entries()) {
    for (const field of urlFields) {
      if (item[field] && !/^(https?:\/\/|\/)/.test(item[field])) errors.push(`${collection}[${index}].${field} must be an http(s) URL or site path`);
    }
  }
}

if (errors.length) {
  console.error("Dev portfolio validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Dev portfolio is valid (${data.projects.length} project${data.projects.length === 1 ? "" : "s"}).`);
