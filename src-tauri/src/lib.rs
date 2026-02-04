mod accessibility;
mod ai;
mod commands;
mod settings;

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
                let _ = app.handle().plugin(tauri_plugin_window_state::Builder::default().build());
            }
            #[cfg(desktop)]
            {
                let shortcut_str = "Ctrl+Shift+Space";
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
            #[cfg(target_os = "windows")]
            {
                use tauri::menu::{Menu, MenuItem};
                use tauri::tray::{TrayIconBuilder, TrayIconEvent, MouseButton};
                use tauri::webview::WebviewWindowBuilder;
                use tauri::WebviewUrl;

                let open_i = MenuItem::with_id(app, "open", "Open", true, None::<&str>)?;
                let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
                let settings_i = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
                let menu = Menu::with_items(app, &[&open_i, &settings_i, &quit_i])?;
                let icon = app.default_window_icon().cloned();
                let mut builder = TrayIconBuilder::new()
                    .menu(&menu)
                    .show_menu_on_left_click(false)
                    .on_tray_icon_event(|tray, event| {
                        match event {
                            TrayIconEvent::Click { button, .. } | TrayIconEvent::DoubleClick { button, .. } => {
                                if button == MouseButton::Left {
                                    let app = tray.app_handle();
                                    open_popup_window(app, get_text_for_popup(app));
                                }
                            }
                            _ => {}
                        }
                    })
                    .on_menu_event(|app, event| {
                        let id = event.id().as_ref();
                        match id {
                            "open" => open_popup_window(app, get_text_for_popup(app)),
                            "quit" => app.exit(0),
                            "settings" => open_settings_window(app),
                            _ => {}
                        }
                    });
                if let Some(icon) = icon {
                    builder = builder.icon(icon);
                }
                let _tray = builder.build(app)?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::fix_grammar_command,
            commands::get_settings_command,
            commands::save_settings_command,
            commands::test_ai_connection_command,
            commands::debug_log
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(target_os = "windows")]
fn open_settings_window(app: &AppHandle) {
    use tauri_plugin_window_state::{StateFlags, WindowExt};

    if let Some(window) = app.get_webview_window("settings") {
        let _ = window.show();
        let _ = window.set_focus();
        return;
    }
    let _ = tauri::WebviewWindowBuilder::new(
        app,
        "settings",
        tauri::WebviewUrl::App("settings.html".into()),
    )
    .title("Settings")
    .inner_size(600.0, 800.0)
    .center()
    .decorations(false)
    .transparent(true)
    .visible(false)
    .build()
    .map(|w| {
        let _ = w.restore_state(StateFlags::all());
        let _ = w.show();
        let _ = w.set_focus();
    });
}

/// Opens the main popup window and sets its text. Used by hotkey, tray "Open", and tray left/double-click.
fn open_popup_window(app: &AppHandle, text: String) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.emit("set-text", text);
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[cfg(target_os = "windows")]
fn get_text_for_popup(app: &AppHandle) -> String {
    PlatformAccessibility::new(app)
        .get_selected_text()
        .unwrap_or_else(|e| {
            eprintln!("Failed to get selected text: {}", e);
            String::new()
        })
}

fn handle_shortcut(app: &AppHandle) {
    #[cfg(target_os = "windows")]
    {
        let text = get_text_for_popup(app);
        eprintln!("Selected text: {}", text);
        open_popup_window(app, text);
    }
    #[cfg(not(target_os = "windows"))]
    {
        open_popup_window(app, String::new());
    }
}
