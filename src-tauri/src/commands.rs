use crate::ai;
use crate::accessibility::{AccessibilityService, PlatformAccessibility};
use crate::settings;

#[tauri::command]
pub async fn fix_grammar_command(app: tauri::AppHandle, text: String) -> Result<ai::Correction, String> {
    let cfg = settings::load_settings(&app).unwrap_or_default();
    ai::fix_grammar_with_config(text, &cfg).await
}

#[tauri::command]
pub fn get_settings_command(app: tauri::AppHandle) -> Result<settings::AppSettings, String> {
    settings::load_settings(&app)
}

#[tauri::command]
pub fn save_settings_command(app: tauri::AppHandle, settings: settings::AppSettings) -> Result<(), String> {
    settings::save_settings(&app, &settings)
}

#[tauri::command]
pub async fn apply_fix_command(app: tauri::AppHandle, text: String) -> Result<(), String> {
    let service = PlatformAccessibility::new(&app);
    service.replace_selected_text(&text)
}

#[tauri::command]
pub fn debug_log(message: String) {
    println!("[Frontend Debug] {}", message);
}
