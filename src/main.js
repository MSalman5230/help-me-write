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
  const loadingDiv = document.getElementById("loading");

  // Listen for text from backend
  listen("set-text", (event) => {
    const text = event.payload;
    originalText = text;
    originalTextArea.value = text;

    diffArea.classList.add("hidden");
    fixBtn.classList.remove("hidden");
    correctedTextArea.value = "";
    explanationDiv.innerText = "";
    updateFixButtonState();
  });

  function updateFixButtonState() {
    fixBtn.disabled = !originalTextArea.value.trim();
  }

  // Sync original text from user input (editable textarea)
  originalTextArea.addEventListener("input", () => {
    originalText = originalTextArea.value;
    fixBtn.classList.remove("hidden");
    updateFixButtonState();
    if (!correctedTextArea.value.trim()) {
      diffArea.classList.add("hidden");
      correctedTextArea.value = "";
      explanationDiv.innerText = "";
    }
  });

  // Initial state and when backend sets text
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
      correctedTextArea.value = correctedText;
      explanationDiv.innerText = result.explanation || "";

      diffArea.classList.remove("hidden");
    } catch (error) {
      log("Error fixing grammar: " + error);
      alert("Error fixing grammar: " + error);
    } finally {
      loadingDiv.classList.add("hidden");
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
