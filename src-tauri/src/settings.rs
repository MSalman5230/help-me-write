use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use std::path::PathBuf;

const SETTINGS_FILENAME: &str = "settings.json";

fn default_api_base() -> String {
    "http://localhost:11434/v1".to_string()
}

fn default_api_key() -> String {
    "ollama".to_string()
}

fn default_model() -> String {
    "gemma3".to_string()
}

fn default_system_prompt() -> String {
    r#"You are a grammar and style fixer. Given the user's text, reply with ONLY a single JSON object (no other text, no markdown). Use this exact shape:
{"corrected": "<the corrected text>"}
No explanation. Output nothing but this JSON."#.to_string()
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AppSettings {
    #[serde(default = "default_api_base")]
    pub api_base: String,
    #[serde(default = "default_api_key")]
    pub api_key: String,
    #[serde(default = "default_model")]
    pub model: String,
    #[serde(default = "default_system_prompt")]
    pub system_prompt: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            api_base: default_api_base(),
            api_key: default_api_key(),
            model: default_model(),
            system_prompt: default_system_prompt(),
        }
    }
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join(SETTINGS_FILENAME))
}

pub fn load_settings(app: &AppHandle) -> Result<AppSettings, String> {
    let path = settings_path(app)?;
    if !path.exists() {
        return Ok(AppSettings::default());
    }
    let contents = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    Ok(serde_json::from_str(&contents).unwrap_or_default())
}

pub fn save_settings(app: &AppHandle, settings: &AppSettings) -> Result<(), String> {
    let path = settings_path(app)?;
    let contents = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    std::fs::write(&path, contents).map_err(|e| e.to_string())
}
