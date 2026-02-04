(function () {
  const { core, window: tauriWindow } = window.__TAURI__ || {};

  if (!core || !core.invoke) {
    console.error("Tauri API not available");
    return;
  }

  const invoke = core.invoke.bind(core);
  const getCurrentWindow = tauriWindow?.getCurrentWindow || (() => ({ hide: async () => {} }));

  async function loadSettings() {
    try {
      const s = await invoke("get_settings_command");
      document.getElementById("api-base").value = s.api_base || "";
      document.getElementById("api-key").value = s.api_key || "";
      document.getElementById("model").value = s.model || "";
      document.getElementById("system-prompt").value = s.system_prompt || "";
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  }

  document.getElementById("settings-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById("save-btn");
    saveBtn.disabled = true;
    try {
      await invoke("save_settings_command", {
        settings: {
          api_base: document.getElementById("api-base").value.trim(),
          api_key: document.getElementById("api-key").value,
          model: document.getElementById("model").value.trim(),
          system_prompt: document.getElementById("system-prompt").value.trim(),
        },
      });
      const w = getCurrentWindow();
      if (w && typeof w.hide === "function") {
        await w.hide();
      } else {
        alert("Settings saved.");
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      alert("Failed to save: " + String(err));
    } finally {
      saveBtn.disabled = false;
    }
  });

  document.getElementById("close-btn").addEventListener("click", async () => {
    try {
      const w = getCurrentWindow();
      if (w && typeof w.hide === "function") {
        await w.hide();
      }
    } catch (e) {
      console.error(e);
    }
  });

  const themeBtn = document.getElementById("theme-btn");
  function updateThemeButtonLabel() {
    const theme = document.documentElement.getAttribute("data-theme") || "dark";
    themeBtn.textContent = theme === "dark" ? "Dark" : "Light";
  }
  updateThemeButtonLabel();
  themeBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
    updateThemeButtonLabel();
  });

  loadSettings();
})();
