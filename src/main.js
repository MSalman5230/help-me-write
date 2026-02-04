// Use global Tauri API (no bundler/imports needed) - runs when DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  const { invoke } = window.__TAURI__.core;
  const { listen } = window.__TAURI__.event;
  const { getCurrentWindow } = window.__TAURI__.window;

  function log(msg) {
    console.log(msg);
    invoke("debug_log", { message: msg }).catch((e) => console.error("Failed to log:", e));
  }

  window.addEventListener("click", (e) => {
    log(`Click at: ${e.clientX}, ${e.clientY} Target: ${e.target.tagName}#${e.target.id || ""}`);
  });
  log("Frontend JS Loaded");

  let originalText = "";
  let correctedText = "";

  const originalTextArea = document.getElementById("original-text");
  const correctedTextArea = document.getElementById("corrected-text");
  const explanationDiv = document.getElementById("explanation");
  const diffArea = document.getElementById("diff-area");
  const fixBtn = document.getElementById("fix-btn");
  const applyBtn = document.getElementById("apply-btn");
  const loadingDiv = document.getElementById("loading");

  // Listen for text from backend
  listen("set-text", (event) => {
    const text = event.payload;
    originalText = text;
    originalTextArea.value = text;

    diffArea.classList.add("hidden");
    applyBtn.classList.add("hidden");
    fixBtn.classList.remove("hidden");
    correctedTextArea.value = "";
    explanationDiv.innerText = "";
  });

  fixBtn.addEventListener("click", async () => {
    log("Fix Button Clicked");
    if (!originalText) {
      log("No original text to fix");
      return;
    }

    loadingDiv.classList.remove("hidden");
    try {
      const result = await invoke("fix_grammar_command", { text: originalText });
      correctedText = result.corrected;
      correctedTextArea.value = correctedText;
      explanationDiv.innerText = result.explanation || "";

      diffArea.classList.remove("hidden");
      fixBtn.classList.add("hidden");
      applyBtn.classList.remove("hidden");
    } catch (error) {
      log("Error fixing grammar: " + error);
      alert("Error fixing grammar: " + error);
    } finally {
      loadingDiv.classList.add("hidden");
    }
  });

  applyBtn.addEventListener("click", async () => {
    log("Apply Button Clicked");
    const textToApply = correctedTextArea.value;
    try {
      await invoke("apply_fix_command", { text: textToApply });
      await getCurrentWindow().hide();
    } catch (e) {
      log("Failed to apply: " + e);
      alert("Failed to apply: " + e);
    }
  });

  document.getElementById("cancel-btn").addEventListener("click", async () => {
    await getCurrentWindow().hide();
  });

  const closeBtn = document.getElementById("close-btn");
  closeBtn.addEventListener("click", async () => {
    console.log("Close button clicked");
    try {
      await getCurrentWindow().hide();
    } catch (e) {
      console.error("Failed to hide window:", e);
      alert("Failed to close: " + e);
    }
  });
});
