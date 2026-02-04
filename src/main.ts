import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";

// Debug: Check if clicks are working
// Debug: Check if clicks are working
function log(msg: string) {
  console.log(msg);
  invoke("debug_log", { message: msg }).catch(e => console.error("Failed to log:", e));
}

window.addEventListener("click", (e) => {
  log(`Click detected at: ${e.clientX}, ${e.clientY} Target: ${(e.target as HTMLElement).tagName}#${(e.target as HTMLElement).id}`);
});
log("Frontend JS Loaded");



let originalText = "";
let correctedText = "";

const originalTextArea = document.getElementById("original-text") as HTMLTextAreaElement;
const correctedTextArea = document.getElementById("corrected-text") as HTMLTextAreaElement;
const explanationDiv = document.getElementById("explanation") as HTMLDivElement;
const diffArea = document.getElementById("diff-area") as HTMLDivElement;
const fixBtn = document.getElementById("fix-btn") as HTMLButtonElement;
const applyBtn = document.getElementById("apply-btn") as HTMLButtonElement;
const loadingDiv = document.getElementById("loading") as HTMLDivElement;

// Listen for text from backend
listen("set-text", (event) => {
  const text = event.payload as string;
  originalText = text;
  originalTextArea.value = text;

  // Reset UI
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
    const result: any = await invoke("fix_grammar_command", { text: originalText });
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
  // Implement Apply Logic (call backend to replace text)
  // If user edited the corrected text, use that
  const textToApply = correctedTextArea.value;
  try {
    await invoke("apply_fix_command", { text: textToApply });
    await getCurrentWindow().hide();
  } catch (e) {
    log("Failed to apply: " + e);
    alert("Failed to apply: " + e);
  }
});

document.getElementById("cancel-btn")?.addEventListener("click", async () => {
  await getCurrentWindow().hide();
});

const closeBtn = document.getElementById("close-btn");
if (closeBtn) {
  closeBtn.addEventListener("click", async () => {
    console.log("Close button clicked");
    try {
      await getCurrentWindow().hide();
    } catch (e) {
      console.error("Failed to hide window:", e);
      alert("Failed to close: " + e);
    }
  });
} else {
  console.error("Close button not found!");
}
