const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const state = { data: null };
const caseNodeKeys = ["customer", "staff", "frontend", "backend", "database", "payment"];
const caseNodeLabels = { customer: "Customer", staff: "Staff", frontend: "Frontend", backend: "Backend API", database: "Database", payment: "Payments" };

const config = {
  experience: { title: (item) => item.role, subtitle: (item) => `${item.company} · ${item.period}`, fields: ["company", "role", "period", "summary", "technologies"], lists: ["technologies"], checks: ["current"] },
  projects: { title: (item) => item.title, subtitle: (item) => `${item.type} · ${item.year}`, fields: ["title", "type", "year", "status", "summary", "role", "teamSize", "frontend", "backend", "database", "deployment", "contribution", "keyFeature", "technicalChallenge", "problem", "solution", "technologies", "stackBreakdown", "highlights", "githubUrl", "liveUrl", "coverImageUrl", "accent"], lists: ["technologies"], lines: ["stackBreakdown", "highlights"], checks: ["featured"] },
  certificates: { title: (item) => item.name, subtitle: (item) => `${item.issuer} · ${item.year}`, fields: ["name", "issuer", "year", "status", "credentialUrl", "description", "imageUrl"] },
  education: { title: (item) => item.degree, subtitle: (item) => `${item.institution} · ${item.period}`, fields: ["degree", "institution", "period", "description", "focus", "imageUrl"], lists: ["focus"] },
  skills: { title: (item) => item.name, subtitle: () => "Capability group", fields: ["name", "description", "items"], lists: ["items"] },
};

function toast(message, isError = false) {
  const target = $("#toast");
  target.textContent = message;
  target.classList.toggle("is-error", isError);
  target.classList.add("is-visible");
  window.setTimeout(() => target.classList.remove("is-visible"), 2800);
}

async function api(path, options = {}) {
  const headers = options.body instanceof FormData ? {} : { "Content-Type": "application/json" };
  const response = await fetch(path, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Request failed.");
  return payload;
}

function split(value, separator = ",") {
  return String(value || "").split(separator).map((item) => item.trim()).filter(Boolean);
}

function setView(view) {
  $$(".aw-view").forEach((element) => element.classList.toggle("is-visible", element.id === `view-${view}`));
  $$("[data-view]").forEach((button) => button.classList.toggle("is-active", button.dataset.view === view));
}

function addContactLink(link = {}) {
  const row = document.createElement("div");
  row.className = "aw-link-row";
  row.innerHTML = `<input data-contact-label placeholder="Label" value="${escapeHtml(link.label || "")}" /><input data-contact-href placeholder="https://..." value="${escapeHtml(link.href || "")}" /><button type="button" aria-label="Remove link">×</button>`;
  $("button", row).addEventListener("click", () => row.remove());
  $("#contact-links").append(row);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

function fillProfile() {
  const form = $("#profile-form");
  Object.entries(state.data.profile).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);
    if (field && typeof value === "string") field.value = value;
  });
  $$('[data-image-upload]', form).forEach((wrapper) => renderImageUpload(wrapper));
  $("#contact-links").innerHTML = "";
  state.data.profile.links.forEach(addContactLink);
}

function profilePayload() {
  const form = $("#profile-form");
  const profile = Object.fromEntries(new FormData(form).entries());
  profile.links = $$(".aw-link-row").map((row) => ({ label: $("[data-contact-label]", row).value.trim(), href: $("[data-contact-href]", row).value.trim() })).filter((link) => link.label && link.href);
  return profile;
}

function renderOverview() {
  const publicProjects = state.data.projects;
  $("#stat-projects").textContent = String(publicProjects.length).padStart(2, "0");
  $("#stat-skills").textContent = String(state.data.skills.length).padStart(2, "0");
  $("#stat-experience").textContent = String(state.data.experience.length).padStart(2, "0");
  $("#stat-learning").textContent = String(state.data.certificates.length + state.data.education.length).padStart(2, "0");
}

function renderList(collection) {
  const target = $(`[data-item-list="${collection}"]`);
  const settings = config[collection];
  const items = state.data[collection] || [];
  target.innerHTML = `<button class="aw-new" type="button" data-new="${collection}">+ New item</button>${items.map((item) => {
    return `<button class="aw-list-item" type="button" data-select="${collection}" data-slug="${escapeHtml(item.slug)}"><span>${escapeHtml(settings.title(item))}</span><small>${escapeHtml(settings.subtitle(item))}</small></button>`;
  }).join("")}`;
}

function fillCollection(collection, item) {
  const form = $(`[data-collection-form="${collection}"]`);
  const settings = config[collection];
  form.reset();
  form.elements.slug.value = item?.slug || "";
  (settings.fields || []).forEach((field) => {
    const input = form.elements.namedItem(field);
    if (!input) return;
    const radioInputs = form.querySelectorAll(`input[name="${field}"][type="radio"]`);
    if (radioInputs.length) {
      const selectedValue = String(item?.[field] || (field === "status" ? "in-progress" : ""));
      radioInputs.forEach((radio) => { radio.checked = radio.value === selectedValue; });
      return;
    }
    if ((settings.lists || []).includes(field)) input.value = (item?.[field] || []).join(", ");
    else if ((settings.lines || []).includes(field)) input.value = (item?.[field] || []).join("\n");
    else input.value = item?.[field] || "";
  });
  (settings.checks || []).forEach((field) => { form.elements.namedItem(field).checked = Boolean(item?.[field]); });
  $$(`[data-image-upload]`, form).forEach((wrapper) => renderImageUpload(wrapper));
  const color = form.elements.namedItem("accent");
  if (color) {
    const value = item?.accent || "";
    color.dataset.empty = String(!/^#[0-9a-f]{6}$/i.test(value));
    color.value = /^#[0-9a-f]{6}$/i.test(value) ? value : "#58a6ff";
    updateAccentValue(color);
  }
  if (collection === "projects") {
    fillCaseStudy(form, item?.caseStudy);
    $("[data-case-mode]", form).value = item?.architecture ? "architecture" : item?.caseStudy ? "form" : "none";
    $("[data-architecture-json]", form).value = item?.architecture ? JSON.stringify(item.architecture, null, 2) : "";
    updateCaseStudyEditor(form);
  }
}

function fillCaseStudy(form, study) {
  study = study || {};
  $(`[data-case-description]`, form).value = study.description || "";
  $(`[data-case-architecture]`, form).value = study.architectureDescription || "";
  $(`[data-case-deployment]`, form).value = study.deploymentLabel || "";
  caseNodeKeys.forEach((key) => {
    const node = study.nodes?.[key] || {};
    $(`[data-node-title="${key}"]`, form).value = node.title || "";
    $(`[data-node-icon="${key}"]`, form).value = node.icon || "server";
    $(`[data-node-lines="${key}"]`, form).value = (node.lines || []).join("\n");
  });
  ["frontendBackend", "backendDatabase", "backendPayment"].forEach((key) => {
    $(`[data-case-label="${key}"]`, form).value = study.connectionLabels?.[key] || "";
  });
  $(`[data-case-technologies]`, form).value = (study.technologies || []).map((row) => `${row.logo} | ${row.title} | ${row.description}`).join("\n");
  $(`[data-case-features]`, form).value = (study.features || []).join("\n");
  $(`[data-case-flow-description]`, form).value = study.flowDescription || "";
  $(`[data-case-flow]`, form).value = (study.flow || []).map((row) => `${row.icon} | ${row.title} | ${row.description}`).join("\n");
}

function readCaseRows(value, columns) {
  return String(value || "").split("\n").map((line) => line.split("|").map((part) => part.trim())).filter((parts) => parts.length === columns && parts.every(Boolean));
}

function renderCaseNodes() {
  const target = $(`[data-case-nodes]`);
  target.innerHTML = caseNodeKeys.map((key) => `<fieldset class="aw-case-node"><legend>${caseNodeLabels[key]}</legend><label>Node title<input data-node-title="${key}" /></label><label>Icon name<input data-node-icon="${key}" placeholder="server, database, browser…" /></label><label>Node details <small>one per line</small><textarea rows="3" data-node-lines="${key}"></textarea></label></fieldset>`).join("");
}

function caseStudyPayload(form) {
  if ($("[data-case-mode]", form).value !== "form") return null;
  const nodes = Object.fromEntries(caseNodeKeys.map((key) => [key, {
    title: $(`[data-node-title="${key}"]`, form).value.trim(),
    icon: $(`[data-node-icon="${key}"]`, form).value.trim() || "server",
    lines: $(`[data-node-lines="${key}"]`, form).value.split("\n").map((line) => line.trim()).filter(Boolean),
  }]));
  const labels = Object.fromEntries(["frontendBackend", "backendDatabase", "backendPayment"].map((key) => [key, $(`[data-case-label="${key}"]`, form).value.trim()]));
  return {
    description: $(`[data-case-description]`, form).value.trim(),
    architectureDescription: $(`[data-case-architecture]`, form).value.trim(),
    techStackDescription: "Core technologies and services used in this project.",
    deploymentLabel: $(`[data-case-deployment]`, form).value.trim(),
    nodes, connectionLabels: labels,
    technologies: readCaseRows($(`[data-case-technologies]`, form).value, 3).map(([logo, title, description]) => ({ logo, title, description })),
    features: $(`[data-case-features]`, form).value.split("\n").map((line) => line.trim()).filter(Boolean),
    flowDescription: $(`[data-case-flow-description]`, form).value.trim(),
    flow: readCaseRows($(`[data-case-flow]`, form).value, 3).map(([icon, title, description]) => ({ icon, title, description })),
  };
}

function payloadFor(collection) {
  const form = $(`[data-collection-form="${collection}"]`);
  const settings = config[collection];
  const payload = Object.fromEntries(new FormData(form).entries());
  (settings.lists || []).forEach((field) => { payload[field] = split(payload[field]); });
  (settings.lines || []).forEach((field) => { payload[field] = split(payload[field], "\n"); });
  (settings.checks || []).forEach((field) => { payload[field] = form.elements.namedItem(field).checked; });
  if (collection === "projects") payload.teamSize = payload.teamSize ? Number(payload.teamSize) : "";
  if (collection === "projects") {
    const mode = $("[data-case-mode]", form).value;
    if (mode === "form") {
      payload.caseStudy = caseStudyPayload(form);
      payload.architecture = null;
    } else if (mode === "architecture") {
      const architectureJson = $("[data-architecture-json]", form).value.trim();
      if (!architectureJson) throw new Error("Enter architecture JSON or choose No case study. No changes were saved.");
      try { payload.architecture = JSON.parse(architectureJson); }
      catch { throw new Error("Architecture data must be valid JSON. No changes were saved."); }
      if (!payload.architecture || typeof payload.architecture !== "object" || Array.isArray(payload.architecture)) throw new Error("Architecture data must be a JSON object. No changes were saved.");
    } else {
      payload.caseStudy = null;
      payload.architecture = null;
    }
  }
  const color = form.elements.namedItem("accent");
  if (color?.dataset.empty === "true") payload.accent = "";
  return payload;
}

function renderImageUpload(wrapper) {
  const form = wrapper.closest("form");
  const value = form.elements.namedItem(wrapper.dataset.imageUpload).value.trim();
  const preview = $(".aw-image-preview", wrapper);
  const dropzone = $(".aw-dropzone", wrapper);
  preview.hidden = !value;
  dropzone.hidden = Boolean(value);
  if (value) {
    $("img", preview).src = value;
    $(".aw-image-path", preview).textContent = value;
  } else {
    $("img", preview).removeAttribute("src");
    $(".aw-image-path", preview).textContent = "";
  }
}

function setUploadStatus(wrapper, message, isError = false) {
  const status = $(".aw-upload-status", wrapper);
  status.textContent = message;
  status.classList.toggle("is-error", isError);
}

async function uploadImage(wrapper, file) {
  if (!file) return;
  const form = wrapper.closest("form");
  const field = form.elements.namedItem(wrapper.dataset.imageUpload);
  const saveButton = $("button[type=submit]", form);
  const controls = $$("button", wrapper);
  controls.forEach((button) => { button.disabled = true; });
  if (saveButton) saveButton.disabled = true;
  wrapper.classList.add("is-uploading");
  setUploadStatus(wrapper, "Uploading and converting to WebP…");
  try {
    const body = new FormData();
    body.append("image", file);
    const result = await api("/api/dev/images", { method: "POST", body });
    field.value = result.imageUrl;
    renderImageUpload(wrapper);
    setUploadStatus(wrapper, "Upload ready. Save this item to keep the image.");
  } catch (error) {
    setUploadStatus(wrapper, error.message, true);
  } finally {
    wrapper.classList.remove("is-uploading");
    controls.forEach((button) => { button.disabled = false; });
    if (saveButton) saveButton.disabled = false;
    $(".aw-file-input", wrapper).value = "";
  }
}

function setupImageUpload(wrapper) {
  const fileInput = $(".aw-file-input", wrapper);
  const dropzone = $(".aw-dropzone", wrapper);
  fileInput.addEventListener("change", () => uploadImage(wrapper, fileInput.files[0]));
  dropzone.addEventListener("click", () => fileInput.click());
  $(".aw-upload-replace", wrapper).addEventListener("click", () => fileInput.click());
  $(".aw-upload-remove", wrapper).addEventListener("click", () => {
    wrapper.closest("form").elements.namedItem(wrapper.dataset.imageUpload).value = "";
    renderImageUpload(wrapper);
    setUploadStatus(wrapper, "Image removed. Save this item to confirm.");
  });
  ["dragenter", "dragover"].forEach((eventName) => wrapper.addEventListener(eventName, (event) => {
    event.preventDefault();
    wrapper.classList.add("is-dragging");
  }));
  ["dragleave", "drop"].forEach((eventName) => wrapper.addEventListener(eventName, (event) => {
    event.preventDefault();
    wrapper.classList.remove("is-dragging");
  }));
  wrapper.addEventListener("drop", (event) => uploadImage(wrapper, event.dataTransfer.files[0]));
}

function setCvStatus(message, isError = false) {
  const status = $("#cv-upload-status");
  status.textContent = message;
  status.classList.toggle("is-error", isError);
}

function showCvInfo(info) {
  const link = $("#cv-current-link");
  if (info.available) {
    link.hidden = false;
    link.textContent = `Current CV · updated ${new Date(info.updatedAt).toLocaleString()}`;
    setCvStatus("A CV is available at /resume.pdf.");
  } else {
    link.hidden = true;
    setCvStatus("No CV PDF is installed yet.");
  }
}

async function uploadCv(file) {
  if (!file) return;
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    setCvStatus("Choose a PDF file.", true);
    return;
  }
  const wrapper = $("#cv-upload");
  const input = $("#cv-file-input");
  const buttons = $$("button", wrapper);
  buttons.forEach((button) => { button.disabled = true; });
  wrapper.classList.add("is-uploading");
  setCvStatus("Uploading CV PDF…");
  try {
    const body = new FormData();
    body.append("cv", file);
    const info = await api("/api/dev/cv", { method: "POST", body });
    showCvInfo(info);
    toast("CV replaced. Rebuild and redeploy to publish the update.");
  } catch (error) {
    setCvStatus(error.message, true);
  } finally {
    wrapper.classList.remove("is-uploading");
    buttons.forEach((button) => { button.disabled = false; });
    input.value = "";
  }
}

const cvWrapper = $("#cv-upload");
const cvInput = $("#cv-file-input");
const cvDropzone = $("#cv-dropzone");
cvInput.addEventListener("change", () => uploadCv(cvInput.files[0]));
cvDropzone.addEventListener("click", () => cvInput.click());
["dragenter", "dragover"].forEach((eventName) => cvWrapper.addEventListener(eventName, (event) => {
  event.preventDefault();
  cvWrapper.classList.add("is-dragging");
}));
["dragleave", "drop"].forEach((eventName) => cvWrapper.addEventListener(eventName, (event) => {
  event.preventDefault();
  cvWrapper.classList.remove("is-dragging");
}));
cvWrapper.addEventListener("drop", (event) => uploadCv(event.dataTransfer.files[0]));

function updateAccentValue(color) {
  const output = $("[data-accent-value]", color.closest(".aw-accent-field"));
  output.textContent = color.dataset.empty === "true" ? "Automatic" : color.value.toUpperCase();
  output.style.setProperty("--selected-accent", color.dataset.empty === "true" ? "#58a6ff" : color.value);
}

$$('[data-image-upload]').forEach(setupImageUpload);
$$('[data-collection-form="projects"] input[name="accent"]').forEach((color) => {
  color.addEventListener("input", () => {
    color.dataset.empty = "false";
    updateAccentValue(color);
  });
  $("[data-accent-reset]", color.closest(".aw-accent-field")).addEventListener("click", () => {
    color.dataset.empty = "true";
    color.value = "#58a6ff";
    updateAccentValue(color);
  });
});

function refreshCollection(collection, saved) {
  const items = state.data[collection];
  const existing = items.findIndex((item) => item.slug === saved.slug);
  if (existing === -1) items.push(saved); else items[existing] = saved;
  renderList(collection);
  fillCollection(collection, saved);
  renderOverview();
}

async function saveCollection(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const collection = form.dataset.collectionForm;
  const currentSlug = form.elements.slug.value;
  try {
    const payload = payloadFor(collection);
    const path = currentSlug ? `/api/dev/${collection}/${encodeURIComponent(currentSlug)}` : `/api/dev/${collection}`;
    const saved = await api(path, { method: currentSlug ? "PUT" : "POST", body: JSON.stringify(payload) });
    refreshCollection(collection, saved);
    toast("Saved");
  } catch (error) { toast(error.message, true); }
}

async function deleteCollection(collection) {
  const form = $(`[data-collection-form="${collection}"]`);
  const slug = form.elements.slug.value;
  if (!slug) return;
  if (!window.confirm("Delete this item?")) return;
  try {
    await api(`/api/dev/${collection}/${encodeURIComponent(slug)}`, { method: "DELETE" });
    state.data[collection] = state.data[collection].filter((item) => item.slug !== slug);
    renderList(collection);
    fillCollection(collection, null);
    renderOverview();
    toast("Deleted");
  } catch (error) { toast(error.message, true); }
}

$("#profile-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    state.data = await api("/api/dev", { method: "PUT", body: JSON.stringify({ profile: profilePayload() }) });
    fillProfile();
    toast("Home and contact saved");
  } catch (error) { toast(error.message, true); }
});

$("#add-contact-link").addEventListener("click", () => addContactLink());
const projectForm = $('[data-collection-form="projects"]');
function updateCaseStudyEditor(form) {
  const mode = $("[data-case-mode]", form).value;
  $("[data-case-editor]", form).hidden = mode !== "form";
  $("[data-architecture-editor]", form).hidden = mode !== "architecture";
  $("[data-case-mode-help]", form).textContent = mode === "form"
    ? "These fields control the public case study. Saving replaces any saved architecture JSON for this project."
    : mode === "architecture"
      ? "This JSON controls the public case study. Saved form content is kept as a fallback; it is not displayed while JSON is active."
      : "Saving removes this project's case-study content. The project card and links remain visible.";
}
$("[data-case-mode]", projectForm).addEventListener("change", () => updateCaseStudyEditor(projectForm));
$("[data-case-template]", projectForm).addEventListener("click", () => {
  const template = state.data?.projects.find((item) => item.slug === "smart-cafeteria-ordering-system")?.caseStudy;
  if (template) { fillCaseStudy(projectForm, template); updateCaseStudyEditor(projectForm); }
  toast(template ? "AURAK layout copied. Edit the details, then save this project." : "Save the AURAK case-study template first.", !template);
});
renderCaseNodes();
updateCaseStudyEditor(projectForm);
$$('[data-collection-form]').forEach((form) => form.addEventListener("submit", saveCollection));
$$('[data-delete]').forEach((button) => button.addEventListener("click", () => deleteCollection(button.dataset.delete)));
document.addEventListener("click", (event) => {
  const newButton = event.target.closest("[data-new]");
  if (newButton) { fillCollection(newButton.dataset.new, null); return; }
  const selected = event.target.closest("[data-select]");
  if (!selected) return;
  const item = state.data[selected.dataset.select].find((entry) => entry.slug === selected.dataset.slug);
  if (item) fillCollection(selected.dataset.select, item);
});
$$('[data-view]').forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));

async function load() {
  try {
    state.data = await api("/api/dev");
    const cvInfo = await api("/api/dev/cv");
    showCvInfo(cvInfo);
    ["skills", "experience", "certificates", "education"].forEach((collection) => { state.data[collection] ??= []; });
    fillProfile();
    ["skills", "projects", "experience", "certificates", "education"].forEach(renderList);
    renderOverview();
    $("#save-state").textContent = "Synced locally";
  } catch (error) { $("#save-state").textContent = "Connection error"; toast(error.message, true); }
}

load();
