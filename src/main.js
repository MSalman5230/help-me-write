// Use global Tauri API (no bundler/imports needed) - runs when DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  const { invoke } = window.__TAURI__.core;
  const { listen } = window.__TAURI__.event;
  const { getCurrentWindow } = window.__TAURI__.window;

  function log(msg) {
    console.log(msg);
    invoke("debug_log", { message: msg }).catch((e) => console.error("Failed to log:", e));
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /** Uses jsdiff (Diff global from index.html script) to highlight added/changed words. */
  function buildDiffHtml(original, corrected) {
    if (typeof Diff === "undefined" || !Diff.diffWords) {
      return escapeHtml(corrected);
    }
    const changes = Diff.diffWords(original, corrected); // jsdiff API
    const parts = [];
    for (const part of changes) {
      if (part.removed) continue;
      const escaped = escapeHtml(part.value);
      if (part.added) {
        parts.push('<span class="diff-add">' + escaped + "</span>");
      } else {
        parts.push(escaped);
      }
    }
    return parts.join("");
  }

  window.addEventListener("click", (e) => {
    log(`Click at: ${e.clientX}, ${e.clientY} Target: ${e.target.tagName}#${e.target.id || ""}`);
  });
  log("Frontend JS Loaded");

  let originalText = "";
  let correctedText = "";

  const originalTextArea = document.getElementById("original-text");
  const correctedPreview = document.getElementById("corrected-preview");
  const copyInlineBtn = document.getElementById("copy-inline-btn");
  const explanationDiv = document.getElementById("explanation");
  const fixBtn = document.getElementById("fix-btn");
  const loadingDiv = document.getElementById("loading");

  function setCorrectedContent(plainText, originalForDiff) {
    correctedText = plainText;
    if (plainText) {
      copyInlineBtn.classList.remove("hidden");
      const original = originalForDiff != null ? originalForDiff : originalTextArea.value.trim();
      correctedPreview.innerHTML = original ? buildDiffHtml(original, plainText) : escapeHtml(plainText);
    } else {
      copyInlineBtn.classList.add("hidden");
      correctedPreview.innerHTML = "";
    }
  }

  // Listen for text from backend
  listen("set-text", (event) => {
    const text = event.payload;
    originalText = text;
    originalTextArea.value = text;
    setCorrectedContent("");
    explanationDiv.innerText = "";
    updateFixButtonState();
  });

  function updateFixButtonState() {
    fixBtn.disabled = !originalTextArea.value.trim();
  }

  originalTextArea.addEventListener("input", () => {
    originalText = originalTextArea.value;
    updateFixButtonState();
    if (!correctedText) {
      setCorrectedContent("");
      explanationDiv.innerText = "";
    }
  });

  updateFixButtonState();

  fixBtn.addEventListener("click", async () => {
    log("Fix Button Clicked");
    const textToFix = originalTextArea.value.trim();
    if (!textToFix) {
      alert("Please enter or paste text to fix.");
      return;
    }

    loadingDiv.classList.remove("hidden");
    try {
      const result = await invoke("fix_grammar_command", { text: textToFix });
      correctedText = result.corrected;
      setCorrectedContent(result.corrected, textToFix);
      explanationDiv.innerText = result.explanation || "";
    } catch (error) {
      log("Error fixing grammar: " + error);
      alert("Error fixing grammar: " + error);
    } finally {
      loadingDiv.classList.add("hidden");
    }
  });

  copyInlineBtn.addEventListener("click", async () => {
    if (!correctedText) return;
    try {
      await navigator.clipboard.writeText(correctedText);
      const label = copyInlineBtn.textContent;
      copyInlineBtn.textContent = "Copied!";
      setTimeout(() => { copyInlineBtn.textContent = label; }, 1500);
    } catch (e) {
      log("Copy failed: " + e);
      alert("Failed to copy to clipboard.");
    }
  });

  document.getElementById("cancel-btn").addEventListener("click", async () => {
    await getCurrentWindow().hide();
  });

  const closeBtn = document.getElementById("close-btn");
  closeBtn.addEventListener("click", async () => {
    try {
      await getCurrentWindow().hide();
    } catch (e) {
      console.error("Failed to hide window:", e);
      alert("Failed to close: " + e);
    }
  });

  document.getElementById("min-btn").addEventListener("click", async () => {
    try {
      await getCurrentWindow().minimize();
    } catch (e) {
      console.error("Failed to minimize:", e);
    }
  });

  document.getElementById("max-btn").addEventListener("click", async () => {
    try {
      await getCurrentWindow().toggleMaximize();
    } catch (e) {
      console.error("Failed to toggle maximize:", e);
    }
  });

  const minIconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/></svg>';
  const maxIconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>';
  const closeIconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  document.getElementById("min-icon").innerHTML = minIconSvg;
  document.getElementById("max-icon").innerHTML = maxIconSvg;
  document.getElementById("close-icon").innerHTML = closeIconSvg;

  const themeBtn = document.getElementById("theme-btn");
  const themeIcon = document.getElementById("theme-icon");
  const sunSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
  const moonSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  function updateThemeButtonIcon() {
    const theme = document.documentElement.getAttribute("data-theme") || "dark";
    themeIcon.innerHTML = theme === "dark" ? moonSvg : sunSvg;
  }
  updateThemeButtonIcon();
  themeBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
    updateThemeButtonIcon();
  });
});
