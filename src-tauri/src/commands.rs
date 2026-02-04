use crate::ai;
use crate::settings;

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

#[tauri::command]
pub fn save_settings_command(app: tauri::AppHandle, settings: settings::AppSettings) -> Result<(), String> {
    settings::save_settings(&app, &settings)
}

#[tauri::command]
pub async fn test_ai_connection_command(settings: settings::AppSettings) -> Result<(), String> {
    ai::test_connection(&settings).await
}

#[tauri::command]
pub fn debug_log(message: String) {
    println!("[Frontend Debug] {}", message);
}
