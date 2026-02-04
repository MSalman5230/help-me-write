mod accessibility;
mod ai;
mod commands;

use tauri::{AppHandle, Manager, Emitter};
use tauri_plugin_global_shortcut::{Code, Modifiers, ShortcutState, Shortcut};
use accessibility::{AccessibilityService, PlatformAccessibility};

use tauri_plugin_global_shortcut::GlobalShortcutExt;

#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::{MessageBoxW, MB_OK, MB_ICONERROR, MB_SYSTEMMODAL};
#[cfg(target_os = "windows")]
use windows::core::PCWSTR;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state == ShortcutState::Pressed  {
                         // Using string comparison or storing the shortcut to compare? 
                         // "Ctrl+Alt+G" logic
                         // For now, assume single shortcut
                         println!("Shortcut pressed!");
                         handle_shortcut(app);
                    }
                })
                .build(),
        )
        .setup(|app| {
            #[cfg(desktop)]
            {
                let shortcut_str = "Ctrl+Alt+Shift+G";
                if let Err(e) = app.global_shortcut().register(shortcut_str) {
                    eprintln!("Failed to register shortcut '{}': {}", shortcut_str, e);
                    #[cfg(target_os = "windows")]
                    unsafe {
                        use windows::core::w;
                        let error_message = format!("Failed to register global shortcut '{}': {}\n\nThe application will continue, but the shortcut will not work.", shortcut_str, e);
                        let title = w!("Error - Help Me Write");
                        
                        // Convert string to wide string for Windows API
                        let error_message_wide: Vec<u16> = error_message.encode_utf16().chain(std::iter::once(0)).collect();
                        let error_message_pcwstr = PCWSTR(error_message_wide.as_ptr());

                        MessageBoxW(None, error_message_pcwstr, title, MB_OK | MB_ICONERROR | MB_SYSTEMMODAL);
                    }
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::fix_grammar_command,
            commands::apply_fix_command,
            commands::debug_log
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn handle_shortcut(app: &AppHandle) {
    let service = PlatformAccessibility::new(app);
    match service.get_selected_text() {
        Ok(text) => {
            eprintln!("Selected text: {}", text);
            if let Some(window) = app.get_webview_window("main") {
                // TODO: Get cursor position and set window position
                
                window.emit("set-text", text).unwrap();
                window.show().unwrap();
                window.set_focus().unwrap();
            }
        }
        Err(e) => {
            eprintln!("Failed to get selected text: {}", e);
        }
    }
}
