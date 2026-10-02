/* AI request helpers. Credentials stay on the Express server. */

(() => {
  async function request(path, controls = {}) {
    const { button, status, loadingText = "Analyzing…", idleText, guidance } = controls;
    const previousText = button?.textContent || idleText || "Analyze with AI";

    if (button) {
      button.disabled = true;
      button.textContent = loadingText;
    }
    if (status) {
      status.textContent = "AI is analyzing the image content…";
      status.classList.remove("error");
    }

    try {
      const response = await fetch(path, {
        method: "POST",
        ...(guidance !== undefined ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guidance }),
        } : {}),
      });
      let payload = null;
      try {
        payload = await response.json();
      } catch {
        /* The server may return an empty response for an infrastructure error. */
      }

      if (!response.ok) {
        throw new Error(payload?.error || `AI request failed (${response.status}).`);
      }

      if (status) status.textContent = "Suggestion loaded. Review it before saving.";
      return payload;
    } catch (error) {
      if (status) {
        status.textContent = error.message || "AI analysis failed.";
        status.classList.add("error");
      }
      throw error;
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = button?.dataset.hasSuggestion === "true"
          ? "Regenerate with AI"
          : idleText || previousText;
      }
    }
  }

  window.PortfolioAI = {
    async analyzePhoto(slug, photoId, controls) {
      const result = await request(`/api/ai/photo/${encodeURIComponent(slug)}/${encodeURIComponent(photoId)}`, {
        ...controls,
        idleText: "Analyze with AI",
      });
      if (controls.button) {
        controls.button.dataset.hasSuggestion = "true";
        controls.button.textContent = "Regenerate with AI";
      }
      return result;
    },

    async analyzeCollection(slug, controls) {
      const result = await request(`/api/ai/collection/${encodeURIComponent(slug)}`, {
        ...controls,
        idleText: "Analyze Collection with AI",
      });
      if (controls.button) {
        controls.button.dataset.hasSuggestion = "true";
        controls.button.textContent = "Regenerate with AI";
      }
      return result;
    },
  };
})();
