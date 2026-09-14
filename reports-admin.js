(() => {
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
  const reportFields = ["id", "title", "slug", "category", "device_model", "repair_type", "tested_functions", "summary", "problem", "diagnosis", "solution"];
  const draftKey = "repair-report-autosave-v1";
  let autosaveTimer;
  let draggedImage = -1;
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
    state.previewUrls = state.imageItems.map((item) => item.file ? URL.createObjectURL(item.file) : `/api/reparaturberichte/bild/${encodeURIComponent(item.id)}`);
    imageCount.textContent = `${state.imageItems.length} / 10`;
    imagePreview.innerHTML = state.imageItems.map((item, index) => `<article class="image-card" draggable="true" data-image-card="${index}"><div class="image-frame"><img src="${state.previewUrls[index]}" alt="Vorschau für ${esc(item.alt)}"><span>${index + 1}</span><button type="button" class="image-remove" data-image-remove="${index}" aria-label="Bild ${index + 1} entfernen">×</button></div><label class="image-field">Bildbeschreibung<input value="${esc(item.alt)}" maxlength="160" data-image-caption="${index}" placeholder="Was ist auf diesem Bild zu sehen?"></label><label class="image-field">Abschnitt<select data-image-stage="${index}"><option value="before" ${item.stage === "before" ? "selected" : ""}>Vorher</option><option value="repair" ${item.stage === "repair" ? "selected" : ""}>Reparatur</option><option value="result" ${item.stage === "result" ? "selected" : ""}>Ergebnis</option></select></label><div class="image-order"><button type="button" data-image-move="up" data-image-index="${index}" ${index === 0 ? "disabled" : ""} aria-label="Bild ${index + 1} nach vorne verschieben">←</button><button type="button" data-image-move="down" data-image-index="${index}" ${index === state.imageItems.length - 1 ? "disabled" : ""} aria-label="Bild ${index + 1} nach hinten verschieben">→</button></div></article>`).join("");
  }

  function updateLivePreview() {
    const values = Object.fromEntries(reportFields.map((field) => [field, reportForm.elements[field]?.value.trim() || ""]));
    livePreview.querySelector("h3").textContent = values.title || "Vorschau des Kundentitels";
    livePreview.querySelector("p").textContent = values.summary || "Hier erscheint die Kurzbeschreibung.";
    const details = livePreview.querySelectorAll("em");
    details[0].textContent = values.device_model || "noch nicht angegeben";
    details[1].textContent = values.repair_type || "noch nicht angegeben";
  }

  function restoreAutosave() {
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey) || "null");
      if (!saved || Date.now() - saved.savedAt > 7 * 24 * 60 * 60 * 1000) return;
      reportFields.filter((field) => field !== "id").forEach((field) => { if (typeof saved[field] === "string") reportForm.elements[field].value = saved[field]; });
      autosaveStatus.textContent = "Automatisch gespeicherte Texte wurden wiederhergestellt.";
    } catch {}
  }

  function scheduleAutosave() {
    updateLivePreview();
    if (reportForm.elements.id.value) return;
    clearTimeout(autosaveTimer);
    autosaveStatus.textContent = "Änderungen werden zwischengespeichert …";
    autosaveTimer = setTimeout(() => {
      const draft = Object.fromEntries(reportFields.filter((field) => field !== "id").map((field) => [field, reportForm.elements[field].value]));
      try { localStorage.setItem(draftKey, JSON.stringify({ ...draft, savedAt: Date.now() })); autosaveStatus.textContent = "Texte lokal zwischengespeichert."; } catch { autosaveStatus.textContent = "Lokale Zwischenspeicherung ist nicht verfügbar."; }
    }, 500);
  }

  function render() {
    reportList.innerHTML = state.reports.length ? state.reports.map((report) => `<article class="item"><span class="meta">${esc(report.status === "published" ? "Veröffentlicht" : "Entwurf")} · ${esc(report.category)}</span><h3>${esc(report.title)}</h3><p>${esc(report.summary)}</p><div class="actions"><button data-edit="${esc(report.id)}">Bearbeiten</button>${report.status === "published" ? `<button data-status="draft" data-id="${esc(report.id)}">Zurückziehen</button><button type="button" data-view="${encodeURIComponent(report.slug)}">Ansehen ↗</button>` : `<button class="primary" data-status="published" data-id="${esc(report.id)}">Veröffentlichen</button>`}<button class="danger" data-status="archived" data-id="${esc(report.id)}">Archivieren</button></div></article>`).join("") : `<div class="item"><h3>Noch keine Berichte</h3><p>Erstelle den ersten Bericht als privaten Entwurf.</p></div>`;
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
    document.querySelector("#editor-title").textContent = report ? "Reparaturbericht bearbeiten" : "Neuer Reparaturbericht";
    for (const field of reportFields) reportForm.elements[field].value = report?.[field] || "";
    if (!report && !reportForm.elements.category.value) reportForm.elements.category.value = "Smartphone & Tablet";
    autosaveStatus.textContent = report ? "Gespeicherten Bericht bearbeiten." : "Texte werden auf diesem Gerät automatisch zwischengespeichert.";
    if (!report) restoreAutosave();
    if (report) {
      syncImageItems(state.images.filter((image) => image.report_id === report.id).map((image) => ({ id: image.id, alt: image.alt_text, stage: image.stage || "repair" })));
    }
    updateLivePreview();
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
      const form = new FormData(reportForm);
      const payload = Object.fromEntries([...form.entries()].filter(([key]) => key !== "images"));
      if (state.imageItems.length > 10) throw new Error("Bitte maximal zehn Fotos auswählen.");
      payload.images = await Promise.all(state.imageItems.map((item) => item.file ? compress(item) : { id: item.id, alt: item.alt, stage: item.stage }));
      await api("report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!payload.id) try { localStorage.removeItem(draftKey); } catch {}
      editor.close();
      showMessage("Entwurf gespeichert.");
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
  document.querySelector("#new-report").addEventListener("click", () => openReport());
  document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => editor.close()));
  document.querySelectorAll("[data-question-close]").forEach((button) => button.addEventListener("click", () => questionEditor.close()));

  document.addEventListener("click", async (event) => {
    const view = event.target.closest("[data-view]");
    if (view) return window.open(`/reparaturberichte/${view.dataset.view}`, "_blank", "noopener");
    const edit = event.target.closest("[data-edit]");
    if (edit) return openReport(state.reports.find((report) => report.id === edit.dataset.edit));
    const status = event.target.closest("[data-status]");
    if (status) {
      status.disabled = true;
      try { await api("status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: status.dataset.id, status: status.dataset.status }) }); showMessage("Status aktualisiert."); await load(); } catch (error) { showMessage(error.message, true); } finally { status.disabled = false; }
      return;
    }
    const questionStatus = event.target.closest("[data-question-status]");
    if (questionStatus) {
      questionStatus.disabled = true;
      try { await api("question", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: questionStatus.dataset.id, status: questionStatus.dataset.questionStatus }) }); showMessage("Frage aktualisiert."); await load(); } catch (error) { showMessage(error.message, true); } finally { questionStatus.disabled = false; }
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
    try { await api("question", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: questionForm.elements.id.value, status: "approved", answer: questionForm.elements.answer.value }) }); questionEditor.close(); showMessage("Antwort veröffentlicht."); await load(); } catch (error) { showMessage(error.message, true); } finally { button.disabled = false; }
  });

  load();
})();
