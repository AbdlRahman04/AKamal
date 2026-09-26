function issue(path, message) {
  return { path, message };
}

function result(data, errors = []) {
  return errors.length ? { success: false, errors } : { success: true, data };
}

function requiredString(value, name, max, errors) {
  if (typeof value !== "string" || !value.trim()) {
    errors.push(issue(name, "must be a non-empty string"));
    return "";
  }
  if (value.trim().length > max) errors.push(issue(name, `must be at most ${max} characters`));
  return value.trim();
}

function optionalString(value, name, max, errors) {
  if (value === undefined) return undefined;
  if (typeof value !== "string") errors.push(issue(name, "must be a string"));
  else if (value.trim().length > max) errors.push(issue(name, `must be at most ${max} characters`));
  return typeof value === "string" ? value.trim() : undefined;
}

function stringArray(value, name, maxItems, itemMax, errors) {
  if (!Array.isArray(value) || value.length > maxItems || value.some((item) => typeof item !== "string" || !item.trim() || item.trim().length > itemMax)) {
    errors.push(issue(name, `must contain at most ${maxItems} non-empty strings of ${itemMax} characters or fewer`));
    return [];
  }
  return [...new Set(value.map((item) => item.trim()))];
}

export function validatePhotoSuggestion(input, allowedTags, maxTags = 6) {
  const errors = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return result(null, [issue("root", "must be an object")]);
  }
  const tags = input.tags;
  if (!Array.isArray(tags) || tags.length > maxTags || tags.some((tag) => typeof tag !== "string" || !allowedTags.includes(tag))) {
    errors.push(issue("tags", `must contain at most ${maxTags} supported technique tags`));
  }
  return result({
    title: requiredString(input.title, "title", 120, errors),
    alt: requiredString(input.alt, "alt", 300, errors),
    story: requiredString(input.story, "story", 2000, errors),
    tags: Array.isArray(tags) ? [...new Set(tags.filter((tag) => allowedTags.includes(tag)))] : [],
  }, errors);
}

export function validateCollectionSuggestion(input) {
  const errors = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return result(null, [issue("root", "must be an object")]);
  }
  if (!["primary", "archive"].includes(input.suggestedSection)) {
    errors.push(issue("suggestedSection", "must be primary or archive"));
  }
  return result({
    title: requiredString(input.title, "title", 120, errors),
    theme: requiredString(input.theme, "theme", 1000, errors),
    intro: requiredString(input.intro, "intro", 2000, errors),
    skillsDemonstrated: requiredString(input.skillsDemonstrated, "skillsDemonstrated", 1000, errors),
    suggestedSection: input.suggestedSection,
  }, errors);
}

export function validateProfileBatchSuggestion(input) {
  const errors = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return result(null, [issue("root", "must be an object")]);
  }
  return result({
    visualThemes: stringArray(input.visualThemes, "visualThemes", 8, 240, errors),
    compositionAndLight: requiredString(input.compositionAndLight, "compositionAndLight", 1600, errors),
    subjectsAndAtmosphere: requiredString(input.subjectsAndAtmosphere, "subjectsAndAtmosphere", 1600, errors),
    storytelling: requiredString(input.storytelling, "storytelling", 1600, errors),
    evolutionSignals: stringArray(input.evolutionSignals, "evolutionSignals", 6, 240, errors),
  }, errors);
}

export function validateProfileDraft(input) {
  const errors = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return result(null, [issue("root", "must be an object")]);
  }
  return result({
    intro: requiredString(input.intro, "intro", 360, errors),
    about: requiredString(input.about, "about", 1800, errors),
    visualThemes: stringArray(input.visualThemes, "visualThemes", 8, 240, errors),
  }, errors);
}
