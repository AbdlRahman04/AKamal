const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const state = { data: null };

const config = {
  experience: { title: (item) => item.role, subtitle: (item) => `${item.company} · ${item.period}`, fields: ["company", "role", "period", "summary", "technologies"], lists: ["technologies"], checks: ["current"] },
  projects: { title: (item) => item.title, subtitle: (item) => `${item.type} · ${item.year}`, fields: ["title", "type", "year", "status", "summary", "role", "teamSize", "frontend", "backend", "database", "deployment", "contribution", "keyFeature", "technicalChallenge", "problem", "solution", "technologies", "stackBreakdown", "highlights", "githubUrl", "liveUrl", "coverImageUrl", "accent"], lists: ["technologies"], lines: ["stackBreakdown", "highlights"], checks: ["featured"] },
  certificates: { title: (item) => item.name, subtitle: (item) => `${item.issuer} · ${item.year}`, fields: ["name", "issuer", "year", "status", "credentialUrl", "description", "imageUrl"] },
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
  $("#stat-learning").textContent = String(state.data.certificates.length).padStart(2, "0");
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
}

function payloadFor(collection) {
  const form = $(`[data-collection-form="${collection}"]`);
  const settings = config[collection];
  const payload = Object.fromEntries(new FormData(form).entries());
  (settings.lists || []).forEach((field) => { payload[field] = split(payload[field]); });
  (settings.lines || []).forEach((field) => { payload[field] = split(payload[field], "\n"); });
  (settings.checks || []).forEach((field) => { payload[field] = form.elements.namedItem(field).checked; });
  if (collection === "projects") payload.teamSize = payload.teamSize ? Number(payload.teamSize) : "";
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
  const payload = payloadFor(collection);
  const currentSlug = form.elements.slug.value;
  try {
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
    ["skills", "experience", "certificates"].forEach((collection) => { state.data[collection] ??= []; });
    fillProfile();
    ["skills", "projects", "experience", "certificates"].forEach(renderList);
    renderOverview();
    $("#save-state").textContent = "Synced locally";
  } catch (error) { $("#save-state").textContent = "Connection error"; toast(error.message, true); }
}

load();
