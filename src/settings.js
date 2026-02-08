(function () {
  const { core, window: tauriWindow } = window.__TAURI__ || {};

  if (!core || !core.invoke) {
    console.error("Tauri API not available");
    return;
  }

  const invoke = core.invoke.bind(core);
  const getCurrentWindow = tauriWindow?.getCurrentWindow || (() => ({ hide: async () => {} }));

  function updateBaseUrlVisibility() {
    const provider = document.getElementById("ai-provider").value;
    const field = document.getElementById("api-base-field");
    if (provider === "openai" || provider === "gemini") {
      field.style.display = "none";
    } else {
      field.style.display = "";
    }
  }

  async function loadSettings() {
    try {
      const s = await invoke("get_settings_command");
      document.getElementById("ai-provider").value = s.ai_provider || "ollama";
      document.getElementById("api-base").value = s.api_base || "";
      document.getElementById("api-key").value = s.api_key || "";
      document.getElementById("model").value = s.model || "";
      document.getElementById("system-prompt").value = s.system_prompt || "";
      document.getElementById("hotkey-input").value = s.hotkey || "Ctrl+Shift+Space";
      updateBaseUrlVisibility();
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  }

  document.getElementById("ai-provider").addEventListener("change", updateBaseUrlVisibility);

  function eventToShortcutString(evt) {
    const parts = [];
    if (evt.ctrlKey) parts.push("Ctrl");
    if (evt.altKey) parts.push("Alt");
    if (evt.shiftKey) parts.push("Shift");
    if (evt.metaKey) parts.push("Meta");
    const code = evt.code;
    if (!code || ["ControlLeft", "ControlRight", "AltLeft", "AltRight", "ShiftLeft", "ShiftRight", "MetaLeft", "MetaRight"].includes(code)) return null;
    parts.push(code);
    return parts.join("+");
  }

  document.getElementById("record-hotkey-btn").addEventListener("click", () => {
    const input = document.getElementById("hotkey-input");
    const btn = document.getElementById("record-hotkey-btn");
    input.placeholder = "Press the key combination…";
    btn.textContent = "Listening…";
    function onKeydown(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      if (evt.code === "Escape") {
        input.placeholder = "e.g. Ctrl+Shift+Space";
        btn.textContent = "Record";
        document.removeEventListener("keydown", onKeydown);
        return;
      }
      const str = eventToShortcutString(evt);
      if (str) {
        input.value = str;
        input.placeholder = "e.g. Ctrl+Shift+Space";
        btn.textContent = "Record";
        document.removeEventListener("keydown", onKeydown);
      }
    }
    document.addEventListener("keydown", onKeydown, true);
  });

  document.getElementById("settings-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById("save-btn");
    saveBtn.disabled = true;
    try {
      await invoke("save_settings_command", {
        settings: {
          ai_provider: document.getElementById("ai-provider").value,
          api_base: document.getElementById("api-base").value.trim(),
          api_key: document.getElementById("api-key").value,
          model: document.getElementById("model").value.trim(),
          system_prompt: document.getElementById("system-prompt").value.trim(),
          hotkey: document.getElementById("hotkey-input").value.trim() || "Ctrl+Shift+Space",
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
      // Keep settings window open so user can change the shortcut
    } finally {
      saveBtn.disabled = false;
    }
  });

  const minIconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/></svg>';
  const maxIconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>';
  const closeIconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  document.getElementById("min-icon").innerHTML = minIconSvg;
  document.getElementById("max-icon").innerHTML = maxIconSvg;
  document.getElementById("close-icon").innerHTML = closeIconSvg;

  document.getElementById("min-btn").addEventListener("click", async () => {
    try {
      const w = getCurrentWindow();
      if (w && typeof w.minimize === "function") await w.minimize();
    } catch (e) {
      console.error(e);
    }
  });

  document.getElementById("max-btn").addEventListener("click", async () => {
    try {
      const w = getCurrentWindow();
      if (w && typeof w.toggleMaximize === "function") await w.toggleMaximize();
    } catch (e) {
      console.error(e);
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

  const testStatus = document.getElementById("test-status");
  const checkSvg = '<svg class="test-icon test-icon-ok" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';
  const crossSvg = '<svg class="test-icon test-icon-fail" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  document.getElementById("test-btn").addEventListener("click", async () => {
    const testBtn = document.getElementById("test-btn");
    testBtn.disabled = true;
    testStatus.innerHTML = "";
    testStatus.className = "test-status";
    try {
      await invoke("test_ai_connection_command", {
        settings: {
          ai_provider: document.getElementById("ai-provider").value,
          api_base: document.getElementById("api-base").value.trim(),
          api_key: document.getElementById("api-key").value,
          model: document.getElementById("model").value.trim(),
          system_prompt: document.getElementById("system-prompt").value.trim(),
        },
      });
      testStatus.innerHTML = checkSvg + " <span>Connection OK</span>";
      testStatus.classList.add("test-status-ok");
    } catch (err) {
      testStatus.innerHTML = crossSvg + " <span>" + String(err).replace(/</g, "&lt;") + "</span>";
      testStatus.classList.add("test-status-fail");
    } finally {
      testBtn.disabled = false;
    }
  });

  loadSettings();
})();
