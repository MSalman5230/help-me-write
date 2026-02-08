use crate::ai;
use crate::settings;
use tauri_plugin_global_shortcut::GlobalShortcutExt;

#[tauri::command]
pub async fn fix_grammar_command(app: tauri::AppHandle, text: String) -> Result<ai::Correction, String> {
    if text.trim().is_empty() {
        return Err("Please enter text to fix.".to_string());
    }
    let cfg = settings::load_settings(&app).unwrap_or_default();
    ai::fix_grammar_with_config(text, &cfg).await
}

#[tauri::command]
pub fn get_settings_command(app: tauri::AppHandle) -> Result<settings::AppSettings, String> {
    settings::load_settings(&app)
}

const DEFAULT_HOTKEY: &str = "Ctrl+Shift+Space";

#[tauri::command]
pub fn save_settings_command(app: tauri::AppHandle, settings: settings::AppSettings) -> Result<(), String> {
    let old_settings = settings::load_settings(&app).unwrap_or_default();
    let old_hotkey = old_settings.hotkey.trim();
    let old_hotkey: &str = if old_hotkey.is_empty() {
        DEFAULT_HOTKEY
    } else {
        old_hotkey
    };
    let new_hotkey: String = {
        let s = settings.hotkey.trim();
        if s.is_empty() {
            DEFAULT_HOTKEY.to_string()
        } else {
            s.to_string()
        }
    };

    #[cfg(desktop)]
    {
        if old_hotkey != new_hotkey.as_str() {
            let _ = app.global_shortcut().unregister(old_hotkey);
            if let Err(e) = app.global_shortcut().register(new_hotkey.as_str()) {
                let _ = app.global_shortcut().register(old_hotkey);
                return Err(format!(
                    "Failed to register shortcut '{}'. It may be in use by another application. ({})",
                    new_hotkey, e
                ));
            }
        }
    }

    let mut to_save = settings;
    to_save.hotkey = new_hotkey;
    settings::save_settings(&app, &to_save)
}

#[tauri::command]
pub async fn test_ai_connection_command(settings: settings::AppSettings) -> Result<(), String> {
    ai::test_connection(&settings).await
}

#[tauri::command]
pub fn debug_log(message: String) {
    println!("[Frontend Debug] {}", message);
}
