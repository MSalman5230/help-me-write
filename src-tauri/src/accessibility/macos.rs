use super::AccessibilityService;
use tauri::AppHandle;

pub struct MacAccessibility {
    app: AppHandle,
}

impl MacAccessibility {
    pub fn new(app: &AppHandle) -> Self {
        MacAccessibility { app: app.clone() }
    }
}

impl AccessibilityService for MacAccessibility {
    fn get_selected_text(&self) -> Result<String, String> {
        Ok("Selected text from macOS (Mock)".to_string())
    }

    fn replace_selected_text(&self, _text: &str) -> Result<(), String> {
        Ok(())
    }
}
