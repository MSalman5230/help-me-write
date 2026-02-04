use tauri::AppHandle;

pub trait AccessibilityService {
    fn get_selected_text(&self) -> Result<String, String>;
    fn replace_selected_text(&self, text: &str) -> Result<(), String>;
}

#[cfg(target_os = "windows")]
mod windows;
#[cfg(target_os = "windows")]
pub use windows::WindowsAccessibility as PlatformAccessibility;

#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "macos")]
pub use macos::MacAccessibility as PlatformAccessibility;
