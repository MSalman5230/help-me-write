
pub trait AccessibilityService {
    fn get_selected_text(&self) -> Result<String, String>;
    /// Replaces the current selection with the given text. Reserved for future "apply suggestion" flow.
    #[allow(dead_code)]
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
