use super::AccessibilityService;
use tauri::{AppHandle, Manager};
use tauri_plugin_clipboard_manager::ClipboardExt;
use std::thread;
use std::time::Duration;
use windows::Win32::UI::Input::KeyboardAndMouse::{
    SendInput, INPUT, INPUT_0, KEYBDINPUT, KEYEVENTF_KEYUP, VK_CONTROL, VK_C, VK_V, VIRTUAL_KEY, INPUT_KEYBOARD,
    VK_SHIFT, VK_MENU
};
use std::mem::size_of;

pub struct WindowsAccessibility {
    app: AppHandle,
}

impl WindowsAccessibility {
    pub fn new(app: &AppHandle) -> Self {
        WindowsAccessibility { app: app.clone() }
    }

    fn send_key_combo(&self, key: VIRTUAL_KEY) {
        let inputs = [
            // Release Shift (prevent interference from hotkey)
            INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: windows::Win32::UI::Input::KeyboardAndMouse::INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: VK_SHIFT,
                        dwFlags: KEYEVENTF_KEYUP,
                        ..Default::default()
                    },
                },
            },
            // Release Alt (prevent interference from hotkey)
            INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: windows::Win32::UI::Input::KeyboardAndMouse::INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: VK_MENU,
                        dwFlags: KEYEVENTF_KEYUP,
                        ..Default::default()
                    },
                },
            },
            // Ctrl Down
            INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: windows::Win32::UI::Input::KeyboardAndMouse::INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: VK_CONTROL,
                        dwFlags: windows::Win32::UI::Input::KeyboardAndMouse::KEYBD_EVENT_FLAGS(0),
                        ..Default::default()
                    },
                },
            },
            // Key Down
            INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: windows::Win32::UI::Input::KeyboardAndMouse::INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: key,
                        dwFlags: windows::Win32::UI::Input::KeyboardAndMouse::KEYBD_EVENT_FLAGS(0),
                        ..Default::default()
                    },
                },
            },
            // Key Up
            INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: windows::Win32::UI::Input::KeyboardAndMouse::INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: key,
                        dwFlags: KEYEVENTF_KEYUP,
                        ..Default::default()
                    },
                },
            },
            // Ctrl Up
            INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: windows::Win32::UI::Input::KeyboardAndMouse::INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: VK_CONTROL,
                        dwFlags: KEYEVENTF_KEYUP,
                        ..Default::default()
                    },
                },
            },
        ];

        unsafe {
            SendInput(&inputs, size_of::<INPUT>() as i32);
        }
    }
}

impl AccessibilityService for WindowsAccessibility {
    fn get_selected_text(&self) -> Result<String, String> {
        // Clear clipboard first to avoid reading old data? Or just rely on new data.
        // It's safer to clear or verify change.
        // For simplicity:
        // 1. Send Ctrl+C
        // 2. Wait
        // 3. Read clipboard
        
        self.send_key_combo(VK_C);
        thread::sleep(Duration::from_millis(100)); // Give app time to copy

        self.app.clipboard().read_text().map_err(|e| e.to_string())
    }

    fn replace_selected_text(&self, text: &str) -> Result<(), String> {
        // 1. Write text to clipboard
        self.app.clipboard().write_text(text).map_err(|e| e.to_string())?;
        
        // 2. Send Ctrl+V
        self.send_key_combo(VK_V);
        
        Ok(())
    }
}
