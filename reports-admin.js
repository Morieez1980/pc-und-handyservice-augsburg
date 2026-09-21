import { buildPublicationDrafts, detectSensitiveContent } from "./publication-copy.js";

const state = { reports: [], images: [], questions: [], imageItems: [], previewUrls: [] };
const reportList = document.querySelector("#report-list");
const questionList = document.querySelector("#question-list");
const editor = document.querySelector("#editor");
const reportForm = document.querySelector("#report-form");
const questionEditor = document.querySelector("#question-editor");
const questionForm = document.querySelector("#question-form");
const message = document.querySelector("#message");
const imagesInput = document.querySelector("#images");
const imagePreview = document.querySelector("#image-preview");
const imageCount = document.querySelector("#image-count");
const livePreview = document.querySelector("#live-preview");
const autosaveStatus = document.querySelector("#autosave-status");
const privacyFlags = document.querySelector("#privacy-flags");
const sensitiveReviewWrap = document.querySelector("#sensitive-review-wrap");
const baseFields = ["device_model", "problem", "diagnosis", "repair", "result"];
const generatedFields = ["title", "slug", "category", "repair_type", "summary", "facebook_text", "instagram_text", "google_text"];
const reportFields = ["id", ...baseFields, "tested_functions", ...generatedFields];
const privacyFields = ["privacy_text", "privacy_photos", "privacy_facts", "privacy_social"];
const draftKey = "repair-report-autosave-v2";
let autosaveTimer;
let draggedImage = -1;
let applyingSuggestions = false;
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

async function api(action, options) {
  const response = await fetch(`/reparaturberichte-admin/api/${action}`, options);
  const data = await response.json().catch(() => ({ error: "Ungültige Serverantwort." }));
  if (!response.ok) throw new Error(data.error || "Aktion fehlgeschlagen.");
  return data;
}

function showMessage(value, error = false) {
  message.textContent = value;
  message.style.color = error ? "#ff9c95" : "#27e0cc";
}

function valuesFromForm() {
  return Object.fromEntries(reportFields.map((field) => [field, reportForm.elements[field]?.value.trim() || ""]));
}

function buildCurrentDrafts(force = false) {
  const values = valuesFromForm();
  return buildPublicationDrafts({
    ...values,
    category: !force && reportForm.elements.category.dataset.auto === "manual" ? values.category : "",
    repair_type: !force && reportForm.elements.repair_type.dataset.auto === "manual" ? values.repair_type : "",
  });
}

function applySuggestions(force = false) {
  const drafts = buildCurrentDrafts(force);
  applyingSuggestions = true;
  for (const field of generatedFields) {
    const element = reportForm.elements[field];
    if (!element) continue;
    if (force || element.dataset.auto !== "manual" || !element.value.trim()) {
      element.value = drafts[field] || "";
      element.dataset.auto = "suggested";
    }
  }
  applyingSuggestions = false;
  updatePreviewAndPrivacy();
}

function clearPreviewUrls() {
  state.previewUrls.forEach((url) => URL.revokeObjectURL(url));
  state.previewUrls = [];
}

function syncImageItems(items) {
  state.imageItems = items.slice(0, 10);
  const transfer = new DataTransfer();
  state.imageItems.filter((item) => item.file).forEach((item) => transfer.items.add(item.file));
  imagesInput.files = transfer.files;
  clearPreviewUrls();
  state.previewUrls = state.imageItems.map((item) => item.file ? URL.createObjectURL(item.file) : `/api/reparaturberichte/bild/${encodeURIComponent(item.id)}?v=20260920-1`);
  imageCount.textContent = `${state.imageItems.length} / 10`;
  imagePreview.innerHTML = state.imageItems.map((item, index) => `<article class="image-card" draggable="true" data-image-card="${index}"><div class="image-frame"><img src="${state.previewUrls[index]}" alt="Vorschau für ${esc(item.alt)}"><span>${index + 1}</span><button type="button" class="image-remove" data-image-remove="${index}" aria-label="Bild ${index + 1} entfernen">×</button></div><label class="image-field">Bildbeschreibung<input value="${esc(item.alt)}" maxlength="160" data-image-caption="${index}" placeholder="Was ist auf diesem Bild zu sehen?"></label><label class="image-field">Abschnitt<select data-image-stage="${index}"><option value="before" ${item.stage === "before" ? "selected" : ""}>Vorher</option><option value="repair" ${item.stage === "repair" ? "selected" : ""}>Reparatur</option><option value="result" ${item.stage === "result" ? "selected" : ""}>Ergebnis</option></select></label><div class="image-order"><button type="button" data-image-move="up" data-image-index="${index}" ${index === 0 ? "disabled" : ""} aria-label="Bild ${index + 1} nach vorne verschieben">←</button><button type="button" data-image-move="down" data-image-index="${index}" ${index === state.imageItems.length - 1 ? "disabled" : ""} aria-label="Bild ${index + 1} nach hinten verschieben">→</button></div></article>`).join("");
}

function updatePreviewAndPrivacy() {
  const values = valuesFromForm();
  livePreview.querySelector("h3").textContent = values.title || "Vorschau des Kundentitels";
  livePreview.querySelector("p").textContent = values.summary || "Hier erscheint die Kurzbeschreibung.";
  const details = livePreview.querySelectorAll("em");
  details[0].textContent = values.device_model || "noch nicht angegeben";
  details[1].textContent = values.repair_type || "noch nicht angegeben";
  for (const field of ["problem", "diagnosis", "repair", "result"]) {
    livePreview.querySelector(`[data-preview="${field}"]`).textContent = values[field] || "noch nicht angegeben";
  }

  const issues = detectSensitiveContent(values);
  sensitiveReviewWrap.hidden = issues.length === 0;
  if (!issues.length) {
    reportForm.elements.sensitive_reviewed.checked = false;
    privacyFlags.classList.remove("warning");
    privacyFlags.innerHTML = "<p>Keine auffälligen Zeichenfolgen in den Texten erkannt. Fotos müssen immer manuell geprüft werden.</p>";
  } else {
    privacyFlags.classList.add("warning");
    privacyFlags.innerHTML = `<strong>Bitte manuell prüfen:</strong><ul>${issues.map((issue) => `<li>${esc(issue)}</li>`).join("")}</ul>`;
  }
}

function restoreAutosave() {
  try {
    const saved = JSON.parse(localStorage.getItem(draftKey) || "null");
    if (!saved || Date.now() - saved.savedAt > 7 * 24 * 60 * 60 * 1000) return;
    reportFields.filter((field) => field !== "id").forEach((field) => {
      if (typeof saved[field] === "string" && reportForm.elements[field]) {
        reportForm.elements[field].value = saved[field];
        if (generatedFields.includes(field) && saved[field]) reportForm.elements[field].dataset.auto = "manual";
      }
    });
    autosaveStatus.textContent = "Automatisch gespeicherte Texte wurden wiederhergestellt.";
  } catch {}
}

function scheduleAutosave(event) {
  if (!applyingSuggestions && event?.target?.name && generatedFields.includes(event.target.name)) event.target.dataset.auto = "manual";
  if (!applyingSuggestions && event?.target?.name && baseFields.includes(event.target.name)) applySuggestions(false);
  else updatePreviewAndPrivacy();
  if (reportForm.elements.id.value) return;
  clearTimeout(autosaveTimer);
  autosaveStatus.textContent = "Änderungen werden zwischengespeichert …";
  autosaveTimer = setTimeout(() => {
    const draft = Object.fromEntries(reportFields.filter((field) => field !== "id").map((field) => [field, reportForm.elements[field]?.value || ""]));
    try {
      localStorage.setItem(draftKey, JSON.stringify({ ...draft, savedAt: Date.now() }));
      autosaveStatus.textContent = "Texte lokal zwischengespeichert.";
    } catch { autosaveStatus.textContent = "Lokale Zwischenspeicherung ist nicht verfügbar."; }
  }, 500);
}

function render() {
  reportList.innerHTML = state.reports.length ? state.reports.map((report) => {
    const checked = Boolean(report.privacy_confirmed_at);
    return `<article class="item"><span class="meta">${esc(report.status === "published" ? "Veröffentlicht" : "Entwurf")} · ${esc(report.category)} · ${checked ? "Prüfung bestätigt" : "Prüfung offen"}</span><h3>${esc(report.title)}</h3><p>${esc(report.summary)}</p><div class="actions"><button data-edit="${esc(report.id)}">Bearbeiten</button>${report.status === "published" ? `<button data-status="draft" data-id="${esc(report.id)}">Zurückziehen</button><button type="button" data-view="${encodeURIComponent(report.slug)}">Ansehen ↗</button>` : `<button class="primary" data-status="published" data-id="${esc(report.id)}" ${checked ? "" : "title=\"Zuerst Datenschutzprüfung im Bericht bestätigen\""}>Veröffentlichen</button>`}<button class="danger" data-status="archived" data-id="${esc(report.id)}">Archivieren</button></div></article>`;
  }).join("") : `<div class="item"><h3>Noch keine Berichte</h3><p>Erstelle den ersten Bericht als privaten Entwurf.</p></div>`;
  questionList.innerHTML = state.questions.length ? state.questions.map((question) => `<article class="item"><span class="meta">${esc(question.status === "pending" ? "Wartet auf Prüfung" : "Freigegeben")} · ${esc(question.report_title)}</span><h3>${esc(question.display_name)}</h3><p class="question-body">${esc(question.body)}</p>${question.answer ? `<p class="answer"><strong>Deine Antwort:</strong><br>${esc(question.answer)}</p>` : ""}<div class="actions"><button class="primary" data-answer="${esc(question.id)}">${question.answer ? "Antwort bearbeiten" : "Antworten und freigeben"}</button>${question.status !== "approved" ? `<button data-question-status="approved" data-id="${esc(question.id)}">Ohne Antwort freigeben</button>` : ""}<button class="danger" data-question-status="hidden" data-id="${esc(question.id)}">Ausblenden</button></div></article>`).join("") : `<div class="item"><p>Keine wartenden oder freigegebenen Fragen.</p></div>`;
}

async function load() {
  try {
    const data = await api("data");
    state.reports = data.reports;
    state.images = data.images;
    state.questions = data.questions;
    render();
  } catch (error) {
    showMessage(error.message, true);
    reportList.innerHTML = `<div class="item"><p>${esc(error.message)}</p></div>`;
    questionList.innerHTML = "";
  }
}

function openReport(report = null) {
  reportForm.reset();
  syncImageItems([]);
  generatedFields.forEach((field) => { reportForm.elements[field].dataset.auto = "suggested"; });
  document.querySelector("#editor-title").textContent = report ? "Reparaturbericht bearbeiten" : "Neuer Reparaturbericht";
  if (report) {
    for (const field of reportFields) {
      let value = report[field] || "";
      if (field === "repair" && !value) value = report.solution || "";
      reportForm.elements[field].value = value;
    }
    generatedFields.forEach((field) => { if (reportForm.elements[field].value) reportForm.elements[field].dataset.auto = "manual"; });
    privacyFields.forEach((field) => { reportForm.elements[field].checked = Boolean(report.privacy_confirmed_at); });
    syncImageItems(state.images.filter((image) => image.report_id === report.id).map((image) => ({ id: image.id, alt: image.alt_text, stage: image.stage || "repair" })));
  } else {
    restoreAutosave();
    if (!baseFields.some((field) => reportForm.elements[field].value.trim())) applySuggestions(true);
  }
  autosaveStatus.textContent = report ? "Gespeicherten Bericht bearbeiten." : autosaveStatus.textContent || "Texte werden auf diesem Gerät automatisch zwischengespeichert.";
  updatePreviewAndPrivacy();
  editor.showModal();
}

async function compress(item) {
  const file = item.file;
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 12_000_000) throw new Error("Bitte nur JPG-, PNG- oder WebP-Bilder bis 12 MB auswählen.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d", { alpha: false }).drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  let quality = 0.84;
  let blob;
  do {
    blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    quality -= 0.08;
  } while (blob && blob.size > 850_000 && quality >= 0.52);
  if (!blob || blob.size > 900_000) throw new Error("Das Bild konnte nicht ausreichend verkleinert werden.");
  return await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve({ data: reader.result, alt: item.alt, stage: item.stage }); reader.onerror = reject; reader.readAsDataURL(blob); });
}

reportForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = reportForm.querySelector("button[type=submit]");
  button.disabled = true;
  try {
    const issues = detectSensitiveContent(valuesFromForm());
    if (issues.length && !reportForm.elements.sensitive_reviewed.checked) throw new Error("Bitte die markierten Datenschutzauffälligkeiten prüfen und bestätigen.");
    const form = new FormData(reportForm);
    const payload = Object.fromEntries([...form.entries()].filter(([key]) => key !== "images"));
    payload.sensitive_reviewed = reportForm.elements.sensitive_reviewed.checked;
    payload.privacy_confirmed = privacyFields.every((field) => reportForm.elements[field].checked);
    if (state.imageItems.length > 10) throw new Error("Bitte maximal zehn Fotos auswählen.");
    payload.images = await Promise.all(state.imageItems.map((item) => item.file ? compress(item) : { id: item.id, alt: item.alt, stage: item.stage }));
    await api("report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!payload.id) try { localStorage.removeItem(draftKey); } catch {}
    editor.close();
    showMessage(payload.privacy_confirmed ? "Entwurf gespeichert; Prüfung bestätigt." : "Privater Entwurf gespeichert. Veröffentlichung bleibt bis zur Prüfung gesperrt.");
    await load();
  } catch (error) { showMessage(error.message, true); } finally { button.disabled = false; }
});

imagesInput.addEventListener("change", (event) => {
  const additions = [...event.target.files];
  const seen = new Set();
  const existing = state.imageItems.map((item) => ({ ...item }));
  const added = additions.map((file, index) => ({ file, alt: file.name.replace(/\.[^.]+$/, ""), stage: !existing.length && index === 0 ? "before" : "repair" }));
  if (!existing.length && added.length > 1) added[added.length - 1].stage = "result";
  const items = [...existing, ...added].filter((item) => {
    const key = item.file ? `${item.file.name}:${item.file.size}:${item.file.lastModified}` : `id:${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (items.length > 10) showMessage("Es wurden nur die ersten zehn unterschiedlichen Fotos übernommen.", true);
  syncImageItems(items);
});

imagePreview.addEventListener("click", (event) => {
  const remove = event.target.closest("[data-image-remove]");
  if (remove) return syncImageItems(state.imageItems.filter((_, index) => index !== Number(remove.dataset.imageRemove)));
  const move = event.target.closest("[data-image-move]");
  if (!move) return;
  const from = Number(move.dataset.imageIndex);
  const to = move.dataset.imageMove === "up" ? from - 1 : from + 1;
  if (to < 0 || to >= state.imageItems.length) return;
  const items = [...state.imageItems];
  [items[from], items[to]] = [items[to], items[from]];
  syncImageItems(items);
});
imagePreview.addEventListener("input", (event) => {
  if (event.target.matches("[data-image-caption]")) state.imageItems[Number(event.target.dataset.imageCaption)].alt = event.target.value;
});
imagePreview.addEventListener("change", (event) => {
  if (event.target.matches("[data-image-stage]")) state.imageItems[Number(event.target.dataset.imageStage)].stage = event.target.value;
});
imagePreview.addEventListener("dragstart", (event) => {
  const card = event.target.closest("[data-image-card]");
  if (!card) return;
  draggedImage = Number(card.dataset.imageCard);
  card.classList.add("dragging");
});
imagePreview.addEventListener("dragover", (event) => event.preventDefault());
imagePreview.addEventListener("drop", (event) => {
  event.preventDefault();
  const card = event.target.closest("[data-image-card]");
  const target = card ? Number(card.dataset.imageCard) : -1;
  if (draggedImage < 0 || target < 0 || draggedImage === target) return;
  const items = [...state.imageItems];
  const [moved] = items.splice(draggedImage, 1);
  items.splice(target, 0, moved);
  draggedImage = -1;
  syncImageItems(items);
});
imagePreview.addEventListener("dragend", () => { draggedImage = -1; imagePreview.querySelectorAll(".dragging").forEach((card) => card.classList.remove("dragging")); });

reportForm.addEventListener("input", scheduleAutosave);
document.querySelector("#regenerate").addEventListener("click", () => applySuggestions(true));
document.querySelector("#new-report").addEventListener("click", () => openReport());
document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => editor.close()));
document.querySelectorAll("[data-question-close]").forEach((button) => button.addEventListener("click", () => questionEditor.close()));

document.addEventListener("click", async (event) => {
  const copy = event.target.closest("[data-copy]");
  if (copy) {
    try {
      await navigator.clipboard.writeText(reportForm.elements[copy.dataset.copy].value);
      showMessage("Text wurde in die Zwischenablage kopiert.");
      copy.textContent = "Kopiert ✓";
      setTimeout(() => { copy.textContent = "Text kopieren"; }, 1600);
    } catch { showMessage("Kopieren war nicht möglich. Bitte den Text markieren und manuell kopieren.", true); }
    return;
  }
  const external = event.target.closest("[data-open]");
  if (external) {
    const destinations = {
      website: "/reparaturberichte",
      facebook: "https://www.facebook.com/profile.php?id=61588640742328",
      instagram: "https://www.instagram.com/pc_handyservice_maurice_keil/",
      google: "https://business.google.com/",
    };
    window.open(destinations[external.dataset.open], "_blank", "noopener");
    return;
  }
  const view = event.target.closest("[data-view]");
  if (view) return window.open(`/reparaturberichte/${view.dataset.view}`, "_blank", "noopener");
  const edit = event.target.closest("[data-edit]");
  if (edit) return openReport(state.reports.find((report) => report.id === edit.dataset.edit));
  const status = event.target.closest("[data-status]");
  if (status) {
    status.disabled = true;
    try {
      await api("status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: status.dataset.id, status: status.dataset.status }) });
      showMessage("Status aktualisiert.");
      await load();
    } catch (error) { showMessage(error.message, true); } finally { status.disabled = false; }
    return;
  }
  const questionStatus = event.target.closest("[data-question-status]");
  if (questionStatus) {
    questionStatus.disabled = true;
    try {
      await api("question", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: questionStatus.dataset.id, status: questionStatus.dataset.questionStatus }) });
      showMessage("Frage aktualisiert.");
      await load();
    } catch (error) { showMessage(error.message, true); } finally { questionStatus.disabled = false; }
    return;
  }
  const answer = event.target.closest("[data-answer]");
  if (answer) {
    const question = state.questions.find((item) => item.id === answer.dataset.answer);
    questionForm.elements.id.value = question.id;
    questionForm.elements.answer.value = question.answer || "";
    document.querySelector("#question-copy").textContent = `${question.display_name}: ${question.body}`;
    questionEditor.showModal();
  }
});

questionForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = questionForm.querySelector("button[type=submit]");
  button.disabled = true;
  try {
    await api("question", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: questionForm.elements.id.value, status: "approved", answer: questionForm.elements.answer.value }) });
    questionEditor.close();
    showMessage("Antwort veröffentlicht.");
    await load();
  } catch (error) { showMessage(error.message, true); } finally { button.disabled = false; }
});

load();
