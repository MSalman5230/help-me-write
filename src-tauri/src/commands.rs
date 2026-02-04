use crate::ai;
use crate::accessibility::{AccessibilityService, PlatformAccessibility};

#[tauri::command]
pub async fn fix_grammar_command(text: String) -> Result<ai::Correction, String> {
    ai::fix_grammar(text).await
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
