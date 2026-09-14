(() => {
  const state = { reports: [], images: [], questions: [] };
  const reportList = document.querySelector("#report-list");
  const questionList = document.querySelector("#question-list");
  const editor = document.querySelector("#editor");
  const reportForm = document.querySelector("#report-form");
  const questionEditor = document.querySelector("#question-editor");
  const questionForm = document.querySelector("#question-form");
  const message = document.querySelector("#message");
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
    document.querySelector("#image-preview").innerHTML = "";
    document.querySelector("#editor-title").textContent = report ? "Reparaturbericht bearbeiten" : "Neuer Reparaturbericht";
    for (const field of ["id", "title", "slug", "category", "summary", "problem", "diagnosis", "solution"]) reportForm.elements[field].value = report?.[field] || "";
    if (report) {
      const images = state.images.filter((image) => image.report_id === report.id);
      document.querySelector("#image-preview").innerHTML = images.map((image) => `<img src="/api/reparaturberichte/bild/${encodeURIComponent(image.id)}" alt="${esc(image.alt_text)}">`).join("");
    }
    editor.showModal();
  }

  async function compress(file) {
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
    return await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve({ data: reader.result, alt: file.name.replace(/\.[^.]+$/, "") }); reader.onerror = reject; reader.readAsDataURL(blob); });
  }

  reportForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = reportForm.querySelector("button[type=submit]");
    button.disabled = true;
    try {
      const form = new FormData(reportForm);
      const payload = Object.fromEntries([...form.entries()].filter(([key]) => key !== "images"));
      const files = [...document.querySelector("#images").files];
      if (files.length > 3) throw new Error("Bitte maximal drei Fotos auswählen.");
      if (files.length || !payload.id) payload.images = await Promise.all(files.map(compress));
      await api("report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      editor.close();
      showMessage("Entwurf gespeichert.");
      await load();
    } catch (error) { showMessage(error.message, true); } finally { button.disabled = false; }
  });

  document.querySelector("#images").addEventListener("change", (event) => {
    document.querySelector("#image-preview").innerHTML = [...event.target.files].slice(0, 3).map((file) => `<span>${esc(file.name)}</span>`).join("");
  });
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
