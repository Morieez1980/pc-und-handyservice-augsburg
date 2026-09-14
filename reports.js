(() => {
  const form = document.querySelector("#question-form");
  if (!form) return;
  const result = form.querySelector(".form-result");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    result.textContent = "Wird übermittelt …";
    const data = new FormData(form);
    try {
      const response = await fetch("/api/reparaturberichte/frage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_id: form.dataset.reportId, display_name: data.get("display_name"), body: data.get("body"), website: data.get("website"), consent: data.get("consent") === "on" }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Übermittlung fehlgeschlagen.");
      result.textContent = payload.message;
      form.reset();
    } catch (error) {
      result.textContent = error instanceof Error ? error.message : "Die Frage konnte nicht gesendet werden.";
    } finally {
      button.disabled = false;
    }
  });
})();
