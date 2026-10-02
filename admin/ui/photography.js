/* ─────────────────────────────────────────────
   Admin JS — Client-side logic for the admin dashboard
   ───────────────────────────────────────────── */

const API = "";

/* ── All known technique tags (from photography.ts) ── */
const ALL_TAGS = [
  "Panning", "Motion Blur", "Shutter Speed", "Environmental Texture",
  "Golden Hour", "Exposure Balance", "Color Grading", "Atmospheric Light",
  "Rule of Thirds", "Leading Lines", "Environmental Framing", "Depth",
  "Visual Balance", "Staging", "Window Light", "Reflection Control",
  "Symmetry", "Detail Macro", "Lifestyle", "Candid", "Day-to-Dusk",
];
const MAX_PHOTO_TAGS = 6;

/* ── State ── */
let data = null;                // full photography.json
let activeSlug = null;          // currently selected collection slug
let selectedPhotoId = null;     // currently selected photo id
let dragSrcId = null;           // photo id being dragged
let collectionDraftDirty = false;
let photoDraftDirty = false;
let profileDraftDirty = false;
let heroDraft = [];
let heroDraftDirty = false;

/* ── DOM refs ── */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const dom = {
  listPrimary:    $("#list-primary"),
  listArchive:    $("#list-archive"),
  profileEditor:  $("#profile-editor"),
  profileEditorButton: $("#btn-profile-editor"),
  profileIntro:   $("#profile-intro"),
  profileAbout:   $("#profile-about"),
  profileEmail:   $("#profile-email"),
  profileInstagram: $("#profile-instagram"),
  profileAiStatus: $("#profile-ai-status"),
  profileAiSummary: $("#profile-ai-summary"),
  profileAiCount: $("#profile-ai-count"),
  profileAiThemes: $("#profile-ai-themes"),
  analyzeProfile: $("#btn-analyze-profile"),
  saveProfile: $("#btn-save-profile"),
  heroSlots: $("#hero-slots"),
  heroStatus: $("#hero-status"),
  saveHero: $("#btn-save-hero"),
  aiServiceDot:   $("#ai-service-dot"),
  aiServiceState: $("#ai-service-state"),
  aiDeployment:   $("#ai-deployment"),
  aiRetries:      $("#ai-retries"),
  aiImageCap:     $("#ai-image-cap"),
  aiPrompts:      $("#ai-prompts"),
  refreshAiStatus: $("#btn-refresh-ai-status"),
  activityStatusDot: $("#activity-status-dot"),
  activityStatus: $("#activity-status"),
  activityErrorCount: $("#activity-error-count"),
  activityAuditCount: $("#activity-audit-count"),
  activityLatest: $("#activity-latest"),
  activityToggle: $("#btn-toggle-activity"),
  activityEvents: $("#activity-events"),
  emptyState:     $("#empty-state"),
  editor:         $("#collection-editor"),
  editorTitle:    $("#editor-title"),
  fieldTheme:     $("#field-theme"),
  fieldIntro:     $("#field-intro"),
  fieldSkills:    $("#field-skills"),
  fieldSection:   $("#field-section"),
  collectionAiStatus: $("#collection-ai-status"),
  analyzeCollection: $("#btn-analyze-collection"),
  saveCollection: $("#btn-save-collection"),
  photoGrid:      $("#photo-grid"),
  photoCount:     $("#photo-count"),
  analyzeAllPhotos: $("#btn-analyze-all-photos"),
  uploadZone:     $("#upload-zone"),
  fileInput:      $("#file-input"),
  uploadProgress: $("#upload-progress"),
  uploadBar:      $("#upload-progress-bar"),
  uploadText:     $("#upload-progress-text"),
  detail:         $("#photo-detail"),
  detailImg:      $("#detail-img"),
  detailTitle:    $("#detail-title"),
  detailLocation: $("#detail-location"),
  detailAlt:      $("#detail-alt"),
  detailStory:    $("#detail-story"),
  detailProcess:  $("#detail-process"),
  detailAiGuidance: $("#detail-ai-guidance"),
  detailFeaturedRank: $("#detail-featuredRank"),
  detailRatio:    $("#detail-aspectRatio"),
  detailRatioCustom: $("#detail-aspectRatio-custom"),
  detailOrient:   $("#detail-orientation"),
  detailFocalImg: $("#detail-focal-img"),
  detailFocalMarker: $("#detail-focal-marker"),
  detailFocalX:   $("#detail-focal-x"),
  detailFocalY:   $("#detail-focal-y"),
  detailFocalXValue: $("#detail-focal-x-value"),
  detailFocalYValue: $("#detail-focal-y-value"),
  detailTags:     $("#detail-tags"),
  tagCount:       $("#tag-count"),
  detailSaveState: $(".detail-save-state"),
  detailSaveLabel: $("#detail-save-label"),
  analyzePhoto:   $("#btn-analyze-photo"),
  savePhoto:      $("#btn-save-photo"),
  modalOverlay:   $("#modal-overlay"),
  modalMessage:   $("#modal-message"),
  modalCancel:    $("#modal-cancel"),
  modalConfirm:   $("#modal-confirm"),
  ncOverlay:      $("#new-collection-overlay"),
  ncTitle:        $("#nc-title"),
  ncSlug:         $("#nc-slug"),
  ncSection:      $("#nc-section"),
  ncTheme:        $("#nc-theme"),
  ncCancel:       $("#nc-cancel"),
  ncCreate:       $("#nc-create"),
};

/* ─────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────── */

async function apiGet(path) {
  const res = await fetch(`${API}${path}`);
  return parseApiResponse(res, "GET", path);
}

async function apiPut(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseApiResponse(res, "PUT", path);
}

async function apiPost(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseApiResponse(res, "POST", path);
}

async function apiDelete(path) {
  const res = await fetch(`${API}${path}`, { method: "DELETE" });
  return parseApiResponse(res, "DELETE", path);
}

async function parseApiResponse(res, method, path) {
  const contentType = res.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    const detail = typeof payload === "object" && payload?.error
      ? payload.error
      : typeof payload === "string" && payload.trim()
        ? payload.trim()
        : `HTTP ${res.status}`;
    throw new Error(`${method} ${path} failed: ${detail}`);
  }

  return payload;
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/* Resolve stored image paths against the API server's photography mount. */
function photographyAssetUrl(value) {
  const raw = String(value || "").trim();
  if (!raw || /^(?:https?:|data:|blob:)/i.test(raw)) return raw;

  const path = raw.replace(/^\/+/, "");
  if (path.startsWith("portfolio/")) return `/${path.replace(/^portfolio\//, "photography/")}`;
  if (path.startsWith("photos/")) return `/photography/${path}`;
  if (path.startsWith("public/photography/")) return `/${path.replace(/^public\//, "")}`;
  return raw.startsWith("/") ? raw : `/${path}`;
}

/* ── Toast ── */

function toast(msg, type = "success") {
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  $("#toast-container").appendChild(el);
  if (type === "error") void loadActivity();
  setTimeout(() => {
    el.classList.add("toast-out");
    el.addEventListener("animationend", () => el.remove());
  }, 2800);
}

/* ── Confirm modal ── */

let _modalResolve = null;

function confirm(message) {
  return new Promise((resolve) => {
    _modalResolve = resolve;
    dom.modalMessage.textContent = message;
    dom.modalOverlay.style.display = "flex";
  });
}

dom.modalCancel.onclick = () => {
  dom.modalOverlay.style.display = "none";
  _modalResolve?.(false);
};
dom.modalConfirm.onclick = () => {
  dom.modalOverlay.style.display = "none";
  _modalResolve?.(true);
};

/* ─────────────────────────────────────────────
   Data loading
   ───────────────────────────────────────────── */

async function loadData() {
  try {
    data = await apiGet("/api/photography");
    renderSidebar();
    if (activeSlug) {
      selectCollection(activeSlug);
    } else {
      openProfileEditor();
    }
    $("#status-indicator").className = "status-dot status-connected";
  } catch (err) {
    toast("Failed to load data: " + err.message, "error");
    $("#status-indicator").className = "status-dot status-error";
  } finally {
    await loadActivity();
  }
}

async function loadAiStatus() {
  try {
    const status = await apiGet("/api/ai/status");
    const configured = Boolean(status.configured);
    dom.aiServiceDot.className = `status-dot ${configured ? "status-connected" : "status-error"}`;
    dom.aiServiceState.textContent = configured
      ? "Configured · key stays server-side"
      : "Not configured · add Azure settings";
    dom.aiDeployment.textContent = status.deployment || "—";
    dom.aiRetries.textContent = String(status.retries ?? "—");
    dom.aiImageCap.textContent = status.imageMaxPixels
      ? `${(status.imageMaxPixels / 1_000_000).toFixed(1)} MP`
      : "—";
    dom.aiPrompts.textContent = status.prompts || "—";
  } catch (err) {
    dom.aiServiceDot.className = "status-dot status-error";
    dom.aiServiceState.textContent = "Status unavailable";
  }
}

dom.refreshAiStatus.addEventListener("click", loadAiStatus);

function formatActivityTime(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function renderActivity(payload) {
  const summary = payload?.summary || {};
  const events = Array.isArray(payload?.events) ? payload.events : [];
  const hasErrors = Number(summary.errorCount) > 0;

  dom.activityStatusDot.className = `status-dot ${hasErrors ? "status-error" : "status-connected"}`;
  dom.activityStatusDot.title = hasErrors ? "Recent admin errors" : "No recent admin errors";
  dom.activityStatus.textContent = hasErrors
    ? `${summary.errorCount} recent error${summary.errorCount === 1 ? "" : "s"} in the activity history.`
    : "No recent errors in the activity history.";
  dom.activityErrorCount.textContent = String(summary.errorCount || 0);
  dom.activityAuditCount.textContent = String(summary.auditCount || 0);

  const latest = events[0];
  dom.activityLatest.textContent = latest
    ? `${latest.kind === "error" ? "Error" : "Latest"}: ${latest.message || latest.action}`
    : "No activity recorded yet.";

  dom.activityEvents.replaceChildren();
  for (const event of events) {
    const row = document.createElement("article");
    row.className = `activity-event${event.kind === "error" ? " is-error" : ""}`;

    const head = document.createElement("div");
    head.className = "activity-event-head";
    const action = document.createElement("span");
    action.textContent = event.action || "Admin activity";
    const time = document.createElement("time");
    time.dateTime = event.timestamp || "";
    time.textContent = formatActivityTime(event.timestamp);
    head.append(action, time);

    const message = document.createElement("p");
    message.className = "activity-event-message";
    message.textContent = event.message || "Admin operation completed.";
    row.append(head, message);
    dom.activityEvents.appendChild(row);
  }
}

async function loadActivity() {
  try {
    renderActivity(await apiGet("/api/activity?limit=8"));
  } catch (err) {
    dom.activityStatusDot.className = "status-dot status-warning";
    dom.activityStatusDot.title = "Activity status unavailable";
    dom.activityStatus.textContent = "Activity history unavailable.";
    dom.activityLatest.textContent = err.message || "Could not load activity history.";
  }
}

dom.activityToggle.addEventListener("click", () => {
  const expanded = dom.activityToggle.getAttribute("aria-expanded") === "true";
  dom.activityToggle.setAttribute("aria-expanded", String(!expanded));
  dom.activityToggle.textContent = expanded ? "Show recent" : "Hide recent";
  dom.activityEvents.hidden = expanded;
});

/* ─────────────────────────────────────────────
   Sidebar
   ───────────────────────────────────────────── */

function renderSidebar() {
  renderList(dom.listPrimary, data.primaryCollections);
  renderList(dom.listArchive, data.archiveCollections);
}

function renderList(ul, collections) {
  ul.innerHTML = "";
  for (const c of collections) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "collection-list-btn" + (c.slug === activeSlug ? " active" : "");
    btn.innerHTML = `
      <span>${c.title}</span>
      <span class="coll-count">${c.photos.length}</span>
    `;
    btn.onclick = () => selectCollection(c.slug);
    li.appendChild(btn);
    ul.appendChild(li);
  }
}

/* ─────────────────────────────────────────────
   Collection editor
   ───────────────────────────────────────────── */

function profileLink(label) {
  return (data?.profile?.socialLinks || []).find((link) => link.label.toLowerCase() === label.toLowerCase())?.href || "";
}

function heroCollections() {
  return [...(data?.primaryCollections || []), ...(data?.archiveCollections || [])]
    .map((collection) => ({
      ...collection,
      photos: (collection.photos || []).filter((photo) => !photo.isPlaceholder && photo.src),
    }))
    .filter((collection) => collection.photos.length);
}

function findHeroSource(image) {
  const sourceCollections = heroCollections();
  if (image?.collectionSlug && image?.photoId) {
    const collection = sourceCollections.find((item) => item.slug === image.collectionSlug);
    const photo = collection?.photos.find((item) => item.id === image.photoId);
    if (photo) return { collection, photo };
  }

  if (image?.src) {
    for (const collection of sourceCollections) {
      const photo = collection.photos.find((item) => item.src === image.src);
      if (photo) return { collection, photo };
    }
  }

  return null;
}

function sourceKey(collectionSlug, photoId) {
  return collectionSlug && photoId ? collectionSlug + "::" + photoId : "";
}

function renderHeroEditor() {
  const images = Array.isArray(data?.hero?.images) ? data.hero.images : [];
  const sourceCollections = heroCollections();
  const slots = Array.from({ length: 3 }, (_value, index) => {
    const image = images[index] || {};
    const source = findHeroSource(image);
    return source
      ? { collectionSlug: source.collection.slug, photoId: source.photo.id }
      : { collectionSlug: image.collectionSlug || "", photoId: image.photoId || "" };
  });

  dom.heroSlots.replaceChildren();
  heroDraftDirty = false;

  slots.forEach((selection, index) => {
    const image = images[index] || {};
    const source = findHeroSource(image);
    const card = document.createElement("article");
    card.className = "hero-slot";

    const heading = document.createElement("div");
    heading.className = "hero-slot-heading";
    const title = document.createElement("strong");
    title.textContent = "Hero image " + String(index + 1).padStart(2, "0");
    const currentTitle = document.createElement("span");
    currentTitle.className = "hero-slot-current";
    currentTitle.textContent = source?.photo.title || "Legacy hero image";
    heading.append(title, currentTitle);

    const preview = document.createElement("img");
    preview.className = "hero-slot-preview";
    preview.src = photographyAssetUrl(source?.photo.thumbnailSrc || image.src || "");
    preview.alt = source?.photo.alt || image.alt || "";
    preview.loading = "lazy";

    const field = document.createElement("label");
    field.className = "field";
    const label = document.createElement("span");
    label.className = "field-label";
    label.textContent = "Portfolio photo";
    const select = document.createElement("select");
    select.className = "field-input";
    select.dataset.heroIndex = String(index);

    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "Select a portfolio photo";
    select.appendChild(emptyOption);

    for (const collection of sourceCollections) {
      const group = document.createElement("optgroup");
      group.label = collection.title;
      for (const photo of collection.photos) {
        const option = document.createElement("option");
        option.value = sourceKey(collection.slug, photo.id);
        option.textContent = photo.title;
        group.appendChild(option);
      }
      select.appendChild(group);
    }

    select.value = sourceKey(selection.collectionSlug, selection.photoId);
    select.addEventListener("change", () => {
      const [collectionSlug = "", photoId = ""] = select.value.split("::");
      heroDraft[index] = { collectionSlug, photoId };
      const selected = findHeroSource(heroDraft[index]);
      preview.src = photographyAssetUrl(selected?.photo.thumbnailSrc || "");
      preview.alt = selected?.photo.alt || "";
      currentTitle.textContent = selected?.photo.title || "Select a portfolio photo";
      markHeroDraftDirty();
    });

    field.append(label, select);
    card.append(heading, preview, field);
    dom.heroSlots.appendChild(card);
  });

  heroDraft = slots;
  dom.heroStatus.textContent = "";
  dom.heroStatus.classList.remove("error");
}

function renderProfileEditor() {
  const profile = data?.profile || {};
  dom.profileIntro.value = profile.intro || "";
  dom.profileAbout.value = profile.about || "";
  dom.profileEmail.value = profile.email || "";
  dom.profileInstagram.value = profileLink("Instagram");
  dom.profileAiStatus.textContent = "";
  dom.profileAiStatus.classList.remove("error");
  dom.profileAiSummary.hidden = true;
  profileDraftDirty = false;
  renderHeroEditor();
}

function openProfileEditor() {
  if (!data) return;
  activeSlug = null;
  selectedPhotoId = null;
  closeDetail();
  dom.emptyState.style.display = "none";
  dom.editor.style.display = "none";
  dom.profileEditor.style.display = "block";
  renderProfileEditor();
  renderSidebar();
}

function markProfileDraftDirty() {
  profileDraftDirty = true;
  dom.profileAiStatus.textContent = "Unsaved profile changes";
  dom.profileAiStatus.classList.remove("error");
}

function markHeroDraftDirty() {
  heroDraftDirty = true;
  dom.heroStatus.textContent = "Unsaved hero image changes";
  dom.heroStatus.classList.remove("error");
}

function profileSocialLinksFromDraft() {
  const values = {
    Instagram: dom.profileInstagram.value.trim(),
  };
  const existing = (Array.isArray(data?.profile?.socialLinks) ? data.profile.socialLinks : [])
    .filter((link) => String(link.label || "").toLowerCase() !== "behance");
  const seen = new Set();
  const links = existing.map((link) => {
    const label = String(link.label || "").trim();
    const key = label.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(values, label)) {
      seen.add(key);
      return { label, href: values[label] };
    }
    return { label, href: String(link.href || "").trim() };
  }).filter((link) => link.label && link.href);

  for (const label of Object.keys(values)) {
    if (!seen.has(label.toLowerCase()) && values[label]) links.push({ label, href: values[label] });
  }
  return links;
}

async function saveProfile() {
  try {
    const profile = await apiPut("/api/photography/profile", {
      intro: dom.profileIntro.value,
      about: dom.profileAbout.value,
      email: dom.profileEmail.value,
      socialLinks: profileSocialLinksFromDraft(),
    });
    data.profile = profile;
    profileDraftDirty = false;
    dom.profileAiStatus.textContent = "All profile changes saved.";
    dom.profileAiStatus.classList.remove("error");
    renderSidebar();
    toast("Profile saved");
  } catch (err) {
    toast("Profile save failed: " + err.message, "error");
  }
}

async function saveHero() {
  if (heroDraft.length !== 3 || heroDraft.some((selection) => !selection.collectionSlug || !selection.photoId)) {
    dom.heroStatus.textContent = "Choose one existing portfolio photo for each hero slot.";
    dom.heroStatus.classList.add("error");
    return;
  }

  try {
    const hero = await apiPut("/api/photography/hero", { images: heroDraft });
    data.hero = hero;
    heroDraftDirty = false;
    renderHeroEditor();
    dom.heroStatus.textContent = "All hero image changes saved.";
    dom.heroStatus.classList.remove("error");
    toast("Hero photos saved");
  } catch (err) {
    dom.heroStatus.textContent = err.message || "Hero image save failed.";
    dom.heroStatus.classList.add("error");
    toast("Hero photo save failed: " + err.message, "error");
  }
}

function renderProfileAiSummary(result) {
  const themes = Array.isArray(result.visualThemes) ? result.visualThemes : [];
  dom.profileAiThemes.replaceChildren();
  for (const theme of themes) {
    const item = document.createElement("span");
    item.textContent = theme;
    dom.profileAiThemes.appendChild(item);
  }
  dom.profileAiCount.textContent = `${result.analyzedImages || 0} images · ${result.batchCount || 0} batches`;
  dom.profileAiSummary.hidden = false;
}

async function analyzeProfileWithAI() {
  if (profileDraftDirty) {
    const ok = await confirm("Replace the current unsaved profile draft with a new AI suggestion?");
    if (!ok) return;
  }

  const button = dom.analyzeProfile;
  const previousText = button.textContent;
  button.disabled = true;
  button.textContent = "Analyzing portfolio…";
  dom.profileAiStatus.textContent = "Reviewing every portfolio image and synthesizing the visual patterns…";
  dom.profileAiStatus.classList.remove("error");

  try {
    const result = await apiPost("/api/ai/profile");
    dom.profileIntro.value = result.intro || dom.profileIntro.value;
    dom.profileAbout.value = result.about || dom.profileAbout.value;
    renderProfileAiSummary(result);
    markProfileDraftDirty();
    dom.profileAiStatus.textContent = "AI draft loaded. Review it, edit it if needed, then save the profile.";
    await loadActivity();
    toast(`AI reviewed ${result.analyzedImages} images across ${result.batchCount} batches`);
  } catch (err) {
    dom.profileAiStatus.textContent = "AI analysis failed. Your existing profile draft is unchanged.";
    dom.profileAiStatus.classList.add("error");
    toast("Portfolio analysis failed: " + err.message, "error");
    await loadActivity();
  } finally {
    button.disabled = false;
    button.textContent = previousText;
  }
}

function setupProfileEditing() {
  [dom.profileIntro, dom.profileAbout, dom.profileEmail, dom.profileInstagram].forEach((field) => {
    field.addEventListener("input", markProfileDraftDirty);
  });
  dom.profileEditorButton.addEventListener("click", openProfileEditor);
  dom.analyzeProfile.addEventListener("click", analyzeProfileWithAI);
  dom.saveProfile.addEventListener("click", saveProfile);
  dom.saveHero.addEventListener("click", saveHero);
}

function getCollection(slug) {
  const all = [...data.primaryCollections, ...data.archiveCollections];
  return all.find((c) => c.slug === slug) || null;
}

function selectCollection(slug) {
  activeSlug = slug;
  selectedPhotoId = null;
  closeDetail();

  const coll = getCollection(slug);
  if (!coll) {
    activeSlug = null;
    dom.profileEditor.style.display = "none";
    dom.editor.style.display = "none";
    dom.emptyState.style.display = "flex";
    return;
  }

  dom.emptyState.style.display = "none";
  dom.profileEditor.style.display = "none";
  dom.editor.style.display = "block";

  dom.editorTitle.textContent = coll.title;
  dom.fieldTheme.value = coll.theme || "";
  dom.fieldIntro.value = coll.intro || "";
  dom.fieldSkills.value = coll.skillsDemonstrated || "";
  dom.fieldSection.value = coll.section || "primary";
  collectionDraftDirty = false;
  dom.collectionAiStatus.textContent = "";
  dom.collectionAiStatus.classList.remove("error");

  renderPhotoGrid(coll);
  renderSidebar();
}

function markCollectionDraftDirty() {
  collectionDraftDirty = true;
  dom.collectionAiStatus.textContent = "Unsaved collection changes";
  dom.collectionAiStatus.classList.remove("error");
}

async function saveCollection() {
  if (!activeSlug) return;

  try {
    await apiPut(`/api/collections/${activeSlug}`, {
      title: dom.editorTitle.textContent.trim(),
      theme: dom.fieldTheme.value,
      intro: dom.fieldIntro.value,
      skillsDemonstrated: dom.fieldSkills.value,
      section: dom.fieldSection.value,
    });
    collectionDraftDirty = false;
    await loadData();
    toast("Collection saved");
  } catch (err) {
    toast("Save failed: " + err.message, "error");
  }
}

function setupCollectionEditing() {
  dom.editorTitle.addEventListener("input", markCollectionDraftDirty);
  dom.fieldTheme.addEventListener("input", markCollectionDraftDirty);
  dom.fieldIntro.addEventListener("input", markCollectionDraftDirty);
  dom.fieldSkills.addEventListener("input", markCollectionDraftDirty);
  dom.fieldSection.addEventListener("change", markCollectionDraftDirty);
  dom.saveCollection.addEventListener("click", saveCollection);
}

/* Section change (move between primary/archive) */

/* Section changes are kept in the draft until Save Changes is pressed. */

/* ─────────────────────────────────────────────
   Photo grid
   ───────────────────────────────────────────── */

function renderPhotoGrid(coll) {
  dom.photoGrid.innerHTML = "";
  dom.photoCount.textContent = coll.photos.length;

  coll.photos.forEach((photo, i) => {
    const card = document.createElement("div");
    const isPlaceholder = photo.isPlaceholder || (!photo.src && !photo.thumbnailSrc);

    card.className = "grid-card" +
      (isPlaceholder ? " grid-card-placeholder" : "") +
      (photo.id === selectedPhotoId ? " selected" : "");
    card.dataset.photoId = photo.id;
    card.draggable = true;

    if (isPlaceholder) {
      card.innerHTML = `
        <span class="grid-card-index">${i + 1}</span>
        <span style="opacity:.5">📷</span>
        <div class="grid-card-overlay">
          <span class="grid-card-label">${escapeHTML(photo.title)}</span>
        </div>
      `;
    } else {
      card.innerHTML = `
        <span class="grid-card-index">${i + 1}</span>
        <img src="${photographyAssetUrl(photo.thumbnailSrc || photo.src)}" alt="${escapeHTML(photo.alt)}" loading="lazy" />
        <div class="grid-card-overlay">
          <span class="grid-card-label">${escapeHTML(photo.title)}</span>
        </div>
      `;
    }

    card.style.aspectRatio = photo.aspectRatio || "4/3";
    const cardImage = card.querySelector("img");
    if (cardImage && photo.focalPoint) {
      cardImage.style.objectPosition = `${photo.focalPoint.x}% ${photo.focalPoint.y}%`;
    }

    /* Click → open detail */
    card.addEventListener("click", () => openDetail(photo.id));

    /* Drag events */
    card.addEventListener("dragstart", onDragStart);
    card.addEventListener("dragover", onDragOver);
    card.addEventListener("dragenter", onDragEnter);
    card.addEventListener("dragleave", onDragLeave);
    card.addEventListener("drop", onDrop);
    card.addEventListener("dragend", onDragEnd);

    dom.photoGrid.appendChild(card);
  });
}

function escapeHTML(str) {
  const d = document.createElement("div");
  d.textContent = str || "";
  return d.innerHTML;
}

/* ── Drag & drop reorder ── */

function onDragStart(e) {
  dragSrcId = e.currentTarget.dataset.photoId;
  e.currentTarget.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
}

function onDragEnter(e) {
  e.preventDefault();
  e.currentTarget.classList.add("drag-over-card");
}

function onDragLeave(e) {
  e.currentTarget.classList.remove("drag-over-card");
}

async function onDrop(e) {
  e.preventDefault();
  const targetId = e.currentTarget.dataset.photoId;
  e.currentTarget.classList.remove("drag-over-card");

  if (!dragSrcId || dragSrcId === targetId || !activeSlug) return;

  const coll = getCollection(activeSlug);
  if (!coll) return;

  const ids = coll.photos.map((p) => p.id);
  const fromIdx = ids.indexOf(dragSrcId);
  const toIdx = ids.indexOf(targetId);
  if (fromIdx === -1 || toIdx === -1) return;

  /* Reorder locally */
  ids.splice(fromIdx, 1);
  ids.splice(toIdx, 0, dragSrcId);

  try {
    await apiPut(`/api/collections/${activeSlug}/reorder`, { photoIds: ids });
    await loadData();
    toast("Reordered");
  } catch (err) {
    toast("Reorder failed: " + err.message, "error");
  }
}

function onDragEnd(e) {
  e.currentTarget.classList.remove("dragging");
  dragSrcId = null;
  $$(".drag-over-card").forEach((el) => el.classList.remove("drag-over-card"));
}

/* ─────────────────────────────────────────────
   Photo detail panel
   ───────────────────────────────────────────── */

function openDetail(photoId) {
  if (!activeSlug) return;
  const coll = getCollection(activeSlug);
  if (!coll) return;

  const photo = coll.photos.find((p) => p.id === photoId);
  if (!photo) return;

  selectedPhotoId = photoId;
  dom.detail.style.display = "flex";

  /* Highlight in grid */
  $$(".grid-card").forEach((el) => el.classList.toggle("selected", el.dataset.photoId === photoId));

  /* Preview image */
  if (photo.src || photo.thumbnailSrc) {
    const previewSrc = photographyAssetUrl(photo.src || photo.thumbnailSrc);
    dom.detailImg.src = previewSrc;
    dom.detailImg.alt = photo.alt || "";
    dom.detailImg.style.display = "block";
    dom.detailFocalImg.src = photographyAssetUrl(photo.thumbnailSrc || photo.src);
    dom.detailFocalImg.alt = photo.alt || "";
    dom.detailFocalImg.style.display = "block";
  } else {
    dom.detailImg.style.display = "none";
    dom.detailFocalImg.style.display = "none";
  }

  /* Fields */
  dom.detailTitle.value = photo.title || "";
  dom.detailLocation.value = photo.location || "";
  dom.detailAlt.value = photo.alt || "";
  dom.detailStory.value = photo.story || "";
  dom.detailProcess.value = photo.process || "";
  dom.detailAiGuidance.value = "";
  dom.detailFeaturedRank.value = photo.featuredRank ? String(photo.featuredRank) : "";
  const ratioIsPreset = [...dom.detailRatio.options].some((option) => option.value === photo.aspectRatio);
  dom.detailRatio.value = photo.aspectRatio && !ratioIsPreset ? "custom" : (photo.aspectRatio || "");
  dom.detailRatioCustom.value = photo.aspectRatio && !ratioIsPreset ? photo.aspectRatio : "";
  syncCustomRatioField();
  dom.detailOrient.value = photo.orientation || "";
  dom.detailFocalX.value = String(photo.focalPoint?.x ?? 50);
  dom.detailFocalY.value = String(photo.focalPoint?.y ?? 50);
  updateFocalPreview();
  photoDraftDirty = false;
  updatePhotoSaveState();

  /* Tags */
  renderTags(photo.tags || []);
}

function closeDetail() {
  dom.detail.style.display = "none";
  selectedPhotoId = null;
  $$(".grid-card").forEach((el) => el.classList.remove("selected"));
}

function updateFocalPreview() {
  const x = Number(dom.detailFocalX.value);
  const y = Number(dom.detailFocalY.value);
  const position = `${x}% ${y}%`;

  dom.detailFocalXValue.value = `${x}%`;
  dom.detailFocalYValue.value = `${y}%`;
  dom.detailImg.style.objectPosition = position;
  dom.detailFocalImg.style.objectPosition = position;
  dom.detailFocalMarker.style.left = `${x}%`;
  dom.detailFocalMarker.style.top = `${y}%`;
}

function syncCustomRatioField() {
  dom.detailRatioCustom.style.display = dom.detailRatio.value === "custom" ? "block" : "none";
}

function updatePhotoSaveState() {
  if (!dom.detailSaveState || !dom.detailSaveLabel) return;
  dom.detailSaveState.classList.toggle("is-dirty", photoDraftDirty);
  dom.detailSaveLabel.textContent = photoDraftDirty ? "Unsaved changes" : "All changes saved";
}

$("#btn-close-detail").onclick = closeDetail;

/* Tag checkboxes */

function renderTags(activeTags) {
  dom.detailTags.innerHTML = "";
  const safeActiveTags = [...new Set(activeTags.filter((tag) => ALL_TAGS.includes(tag)))].slice(0, MAX_PHOTO_TAGS);
  for (const tag of ALL_TAGS) {
    const label = document.createElement("label");
    label.className = "tag-chip";
    label.innerHTML = `
      <input type="checkbox" value="${tag}" ${safeActiveTags.includes(tag) ? "checked" : ""} />
      <span class="tag-chip-label">${tag}</span>
    `;
    label.querySelector("input").addEventListener("change", markPhotoDraftDirty);
    dom.detailTags.appendChild(label);
  }
  updateTagAvailability();
}

function selectedTagValues() {
  return [...dom.detailTags.querySelectorAll("input:checked")].map((cb) => cb.value);
}

function mergeTags(existingTags, suggestedTags) {
  return [...new Set([...existingTags, ...suggestedTags])]
    .filter((tag) => ALL_TAGS.includes(tag))
    .slice(0, MAX_PHOTO_TAGS);
}

function updateTagAvailability() {
  const selected = selectedTagValues();
  const atLimit = selected.length >= MAX_PHOTO_TAGS;
  dom.tagCount.textContent = `${selected.length}/${MAX_PHOTO_TAGS} selected`;
  dom.detailTags.querySelectorAll("input").forEach((input) => {
    input.disabled = !input.checked && atLimit;
  });
}

function markPhotoDraftDirty() {
  photoDraftDirty = true;
  updatePhotoSaveState();
  updateTagAvailability();
}

/* Photo metadata is saved explicitly from the detail footer. */
function setupPhotoEditing() {
  const fields = [dom.detailTitle, dom.detailLocation, dom.detailAlt, dom.detailStory, dom.detailProcess];
  fields.forEach((el) => el.addEventListener("input", markPhotoDraftDirty));

  const selects = [dom.detailFeaturedRank, dom.detailRatio, dom.detailOrient];
  selects.forEach((el) => el.addEventListener("change", markPhotoDraftDirty));
  dom.detailRatio.addEventListener("change", syncCustomRatioField);
  dom.detailRatioCustom.addEventListener("input", markPhotoDraftDirty);
  [dom.detailFocalX, dom.detailFocalY].forEach((el) => el.addEventListener("input", () => {
    markPhotoDraftDirty();
    updateFocalPreview();
  }));
  dom.savePhoto.addEventListener("click", savePhoto);
}

async function savePhoto() {
  if (!activeSlug || !selectedPhotoId) return;

  const tags = selectedTagValues().slice(0, MAX_PHOTO_TAGS);

  try {
    await apiPut(`/api/collections/${activeSlug}/photos/${selectedPhotoId}`, {
      title: dom.detailTitle.value,
      location: dom.detailLocation.value.trim() || null,
      alt: dom.detailAlt.value,
      story: dom.detailStory.value,
      process: dom.detailProcess.value,
      featuredRank: dom.detailFeaturedRank.value ? Number(dom.detailFeaturedRank.value) : null,
      aspectRatio: (dom.detailRatio.value === "custom"
        ? dom.detailRatioCustom.value.trim()
        : dom.detailRatio.value) || null,
      orientation: dom.detailOrient.value || null,
      focalPoint: { x: Number(dom.detailFocalX.value), y: Number(dom.detailFocalY.value) },
      tags,
    });
    const savedPhotoId = selectedPhotoId;
    photoDraftDirty = false;
    updatePhotoSaveState();
    await loadData();
    openDetail(savedPhotoId);
    toast("Photo saved");
  } catch (err) {
    toast("Save failed: " + err.message, "error");
  }
}

/* ─────────────────────────────────────────────
   Upload
   ───────────────────────────────────────────── */

async function analyzePhotoWithAI() {
  if (!activeSlug || !selectedPhotoId) return;

  if (photoDraftDirty) {
    const ok = await confirm("Replace the current unsaved photo draft with a new AI suggestion?");
    if (!ok) return;
  }

  try {
    const suggestion = await window.PortfolioAI.analyzePhoto(activeSlug, selectedPhotoId, {
      guidance: dom.detailAiGuidance.value.trim(),
      button: dom.analyzePhoto,
    });
    dom.detailTitle.value = suggestion.title;
    dom.detailAlt.value = suggestion.alt;
    dom.detailStory.value = suggestion.story;
    dom.detailProcess.value = suggestion.process || "";
    const combinedTags = mergeTags(selectedTagValues(), suggestion.tags || []);
    renderTags(combinedTags);
    markPhotoDraftDirty();
    await loadActivity();
    toast("AI suggestions loaded — your tags were kept and complementary tags were added");
  } catch (err) {
    toast("AI analysis failed: " + err.message, "error");
    await loadActivity();
  }
}

async function analyzeCollectionWithAI() {
  if (!activeSlug) return;

  if (collectionDraftDirty) {
    const ok = await confirm("Replace the current unsaved collection draft with a new AI suggestion?");
    if (!ok) return;
  }

  try {
    const suggestion = await window.PortfolioAI.analyzeCollection(activeSlug, {
      button: dom.analyzeCollection,
      status: dom.collectionAiStatus,
    });
    dom.editorTitle.textContent = suggestion.title;
    dom.fieldTheme.value = suggestion.theme;
    dom.fieldIntro.value = suggestion.intro;
    dom.fieldSkills.value = suggestion.skillsDemonstrated;
    dom.fieldSection.value = suggestion.suggestedSection;
    markCollectionDraftDirty();
    await loadActivity();
    toast("AI suggestions loaded — review before saving");
  } catch (err) {
    toast("AI analysis failed: " + err.message, "error");
    await loadActivity();
  }
}

async function analyzeAllPhotosWithAI() {
  if (!activeSlug) return;

  const coll = getCollection(activeSlug);
  const photos = coll?.photos.filter((photo) => !photo.isPlaceholder && (photo.src || photo.thumbnailSrc)) || [];
  if (!photos.length) {
    toast("There are no real photos to analyze", "error");
    return;
  }

  const ok = await confirm(`Analyze and save AI metadata for all ${photos.length} photos? Existing titles, alt text, and stories will be replaced; existing tags will be kept and complementary tags added up to six total.`);
  if (!ok) return;

  const button = dom.analyzeAllPhotos;
  const previousText = button.textContent;
  let completed = 0;
  let failed = 0;
  button.disabled = true;

  try {
    for (const photo of photos) {
      button.textContent = `Analyzing ${completed + failed + 1}/${photos.length}…`;
      dom.collectionAiStatus.textContent = `Analyzing ${completed + failed + 1} of ${photos.length}: ${photo.title || "Untitled"}`;
      dom.collectionAiStatus.classList.remove("error");

      try {
        const suggestion = await apiPost(`/api/ai/photo/${encodeURIComponent(activeSlug)}/${encodeURIComponent(photo.id)}`);
        const saved = await apiPut(`/api/collections/${encodeURIComponent(activeSlug)}/photos/${encodeURIComponent(photo.id)}`, {
          title: suggestion.title,
          alt: suggestion.alt,
          story: suggestion.story,
          process: suggestion.process || "",
          tags: mergeTags(photo.tags || [], suggestion.tags || []),
        });
        Object.assign(photo, saved);
        completed++;
      } catch (error) {
        failed++;
        console.error(`AI analysis failed for ${photo.id}`, error);
      }
    }

    try {
      await apiPost("/api/activity", {
        action: "ai.batch.completed",
        collection: activeSlug,
        completed,
        failed,
      });
    } catch (error) {
      console.error("Could not record batch activity", error);
    }

    await loadData();
    if (failed) {
      dom.collectionAiStatus.textContent = `${completed} analyzed, ${failed} failed. Review the failed photos individually.`;
      dom.collectionAiStatus.classList.add("error");
      toast(`Batch finished with ${failed} failure${failed === 1 ? "" : "s"}`, "error");
    } else {
      dom.collectionAiStatus.textContent = `${completed} photos analyzed and saved.`;
      toast(`Analyzed and saved ${completed} photos`);
    }
  } finally {
    button.disabled = false;
    button.textContent = previousText;
  }
}

dom.analyzePhoto.addEventListener("click", analyzePhotoWithAI);
dom.analyzeCollection.addEventListener("click", analyzeCollectionWithAI);
dom.analyzeAllPhotos.addEventListener("click", analyzeAllPhotosWithAI);

function setupUpload() {
  const zone = dom.uploadZone;

  /* Browse button */
  $("#btn-browse").addEventListener("click", (e) => {
    e.stopPropagation();
    dom.fileInput.click();
  });

  zone.addEventListener("click", () => dom.fileInput.click());

  /* Drag events on upload zone */
  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.classList.add("drag-over");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("drag-over");
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  });

  dom.fileInput.addEventListener("change", () => {
    if (dom.fileInput.files.length) {
      uploadFiles(dom.fileInput.files);
      dom.fileInput.value = "";
    }
  });
}

async function uploadFiles(fileList) {
  if (!activeSlug) return toast("Select a collection first", "error");

  const files = [...fileList];
  const total = files.length;
  let done = 0;
  const uploadedPhotos = [];

  dom.uploadProgress.style.display = "flex";
  $(".upload-zone-content").style.display = "none";

  for (const file of files) {
    dom.uploadText.textContent = `Uploading ${done + 1} of ${total}…`;
    dom.uploadBar.style.width = `${(done / total) * 100}%`;

    const fd = new FormData();
    fd.append("photo", file);
    fd.append("title", file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));

    try {
      const res = await fetch(`${API}/api/collections/${activeSlug}/photos`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      uploadedPhotos.push(await res.json());
      done++;
    } catch (err) {
      toast(`Failed: ${file.name} — ${err.message}`, "error");
    }
  }

  dom.uploadBar.style.width = "100%";
  dom.uploadText.textContent = `Done — ${done} of ${total} uploaded.`;

  setTimeout(() => {
    dom.uploadProgress.style.display = "none";
    $(".upload-zone-content").style.display = "flex";
    dom.uploadBar.style.width = "0%";
  }, 1500);

  await loadData();
  if (uploadedPhotos.length) {
    openDetail(uploadedPhotos[uploadedPhotos.length - 1].id);
  }
  if (done > 0) toast(`${done} photo${done > 1 ? "s" : ""} uploaded`);
}

/* ─────────────────────────────────────────────
   Delete photo
   ───────────────────────────────────────────── */

$("#btn-delete-photo").addEventListener("click", async () => {
  if (!activeSlug || !selectedPhotoId) return;

  const ok = await confirm("Permanently delete this photo and its image files?");
  if (!ok) return;

  try {
    await apiDelete(`/api/collections/${activeSlug}/photos/${selectedPhotoId}`);
    closeDetail();
    await loadData();
    toast("Photo deleted");
  } catch (err) {
    toast("Delete failed: " + err.message, "error");
  }
});

/* ─────────────────────────────────────────────
   Replace image
   ───────────────────────────────────────────── */

$("#btn-replace-image").addEventListener("click", () => {
  if (!activeSlug || !selectedPhotoId) return;

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/jpeg,image/png,image/webp,image/tiff";

  input.addEventListener("change", async () => {
    if (!input.files.length) return;

    const fd = new FormData();
    fd.append("photo", input.files[0]);

    try {
      /* Delete old, upload new, keep metadata */
      const coll = getCollection(activeSlug);
      const photo = coll?.photos.find((p) => p.id === selectedPhotoId);
      if (!photo) return;

      /* Delete old photo */
      await apiDelete(`/api/collections/${activeSlug}/photos/${selectedPhotoId}`);

      /* Upload new image with the same metadata */
      fd.append("title", photo.title || "");
      if (photo.location) fd.append("location", photo.location);
      fd.append("alt", photo.alt || "");
      fd.append("story", photo.story || "");
      fd.append("tags", JSON.stringify(photo.tags || []));
      if (photo.featuredRank) fd.append("featuredRank", String(photo.featuredRank));
      if (photo.aspectRatio) fd.append("aspectRatio", photo.aspectRatio);
      if (photo.orientation) fd.append("orientation", photo.orientation);
      if (photo.focalPoint) fd.append("focalPoint", JSON.stringify(photo.focalPoint));

      const res = await fetch(`${API}/api/collections/${activeSlug}/photos`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);

      const newPhoto = await res.json();

      closeDetail();
      await loadData();

      /* Re-select the new photo */
      openDetail(newPhoto.id);
      toast("Image replaced");
    } catch (err) {
      toast("Replace failed: " + err.message, "error");
    }
  });

  input.click();
});

/* ─────────────────────────────────────────────
   Delete collection
   ───────────────────────────────────────────── */

$("#btn-delete-collection").addEventListener("click", async () => {
  if (!activeSlug) return;
  const coll = getCollection(activeSlug);
  if (!coll) return;

  const ok = await confirm(`Delete the entire "${coll.title}" collection and all its photos?`);
  if (!ok) return;

  /* Remove from data */
  const srcList = coll.section === "primary" ? data.primaryCollections : data.archiveCollections;
  const idx = srcList.findIndex((c) => c.slug === activeSlug);
  if (idx !== -1) srcList.splice(idx, 1);

  try {
    await apiPut("/api/photography", data);
    activeSlug = null;
    closeDetail();
    dom.editor.style.display = "none";
    dom.emptyState.style.display = "flex";
    await loadData();
    toast("Collection deleted");
  } catch (err) {
    toast("Delete failed: " + err.message, "error");
  }
});

/* ─────────────────────────────────────────────
   New collection
   ───────────────────────────────────────────── */

$("#btn-new-collection").addEventListener("click", () => {
  dom.ncTitle.value = "";
  dom.ncSlug.value = "";
  dom.ncSection.value = "primary";
  dom.ncTheme.value = "";
  dom.ncOverlay.style.display = "flex";
  dom.ncTitle.focus();
});

/* Auto-slug from title */
dom.ncTitle.addEventListener("input", () => {
  dom.ncSlug.value = slugify(dom.ncTitle.value);
});

dom.ncCancel.onclick = () => {
  dom.ncOverlay.style.display = "none";
};

dom.ncCreate.addEventListener("click", async () => {
  const title = dom.ncTitle.value.trim();
  const slug = dom.ncSlug.value.trim() || slugify(title);
  const section = dom.ncSection.value;
  const theme = dom.ncTheme.value.trim();

  if (!title || !slug) {
    toast("Title and slug are required", "error");
    return;
  }

  /* Check for slug collision */
  if (getCollection(slug)) {
    toast(`A collection with slug "${slug}" already exists`, "error");
    return;
  }

  const newColl = {
    slug,
    title,
    theme,
    intro: "",
    skillsDemonstrated: "",
    coverImage: "",
    section,
    photos: [],
  };

  const list = section === "primary" ? data.primaryCollections : data.archiveCollections;
  list.push(newColl);

  try {
    await apiPut("/api/photography", data);
    dom.ncOverlay.style.display = "none";
    await loadData();
    selectCollection(slug);
    toast("Collection created");
  } catch (err) {
    toast("Create failed: " + err.message, "error");
  }
});

/* ─────────────────────────────────────────────
   Init
   ───────────────────────────────────────────── */

setupCollectionEditing();
setupPhotoEditing();
setupProfileEditing();
setupUpload();
loadData();
loadAiStatus();
