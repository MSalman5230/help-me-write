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

  loadSettings();
})();
