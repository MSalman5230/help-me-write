use crate::settings::AppSettings;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct Correction {
    pub original: String,
    pub corrected: String,
    pub explanation: Option<String>,
}

// OpenAI-compatible request (minimal fields)
#[derive(Serialize)]
struct ChatMessage {
    role: String,
    content: String,
}

/// Request JSON object mode so the model returns only valid JSON (corrected text in our schema).
#[derive(Serialize)]
struct ResponseFormat {
    #[serde(rename = "type")]
    type_: String,
}

#[derive(Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
    /// Enforces JSON output; supported by OpenAI and Ollama /v1/chat/completions.
    #[serde(skip_serializing_if = "Option::is_none")]
    response_format: Option<ResponseFormat>,
}

// OpenAI-compatible response (minimal fields)
#[derive(Deserialize)]
struct ChatResponse {
    choices: Vec<Choice>,
}

#[derive(Deserialize)]
struct Choice {
    message: Message,
}

#[derive(Deserialize)]
struct Message {
    content: Option<String>,
}

/// Structured output schema: we only use the corrected text.
#[derive(Deserialize)]
struct GrammarResponse {
    corrected: String,
}

/// Returns the effective API base URL from provider and stored api_base.
/// OpenAI and Gemini use fixed URLs; Ollama and Custom use the user's api_base.
fn effective_api_base(config: &AppSettings) -> String {
    let provider = config.ai_provider.trim().to_lowercase();
    match provider.as_str() {
        "openai" => "https://api.openai.com/v1".to_string(),
        "gemini" => "https://generativelanguage.googleapis.com/v1beta".to_string(),
        "ollama" | "custom" => {
            let base = config.api_base.trim();
            if base.is_empty() {
                std::env::var("OPENAI_API_BASE").unwrap_or_else(|_| "http://localhost:11434/v1".to_string())
            } else {
                base.to_string()
            }
        }
        _ => {
            let base = config.api_base.trim();
            if base.is_empty() {
                "http://localhost:11434/v1".to_string()
            } else {
                base.to_string()
            }
        }
    }
}

fn default_model_for_base(base: &str) -> &'static str {
    if base.contains("api.openai.com") {
        "gpt-5-nano"
    } else if base.contains("generativelanguage.googleapis.com") {
        "gemini-3-flash-preview"
    } else {
        "gemma3"
    }
}

/// System prompt: we use response_format "json_object" which only enforces "valid JSON object",
/// not which keys. So we must specify the shape here; otherwise the model might use different keys.
/// (If we passed a full JSON schema via response_format, we could omit the shape from the prompt.)
const DEFAULT_SYSTEM_PROMPT: &str = r#"You are a grammar and style fixer. Reply with a single JSON object only. Use this exact shape:
{"corrected": "<the corrected text>"}
Output nothing else. No explanation, no markdown."#;



/// Strip optional markdown code fences (e.g. ```json ... ```) so we can parse the JSON.
fn strip_markdown_code_fence(content: &str) -> &str {
    let content = content.trim();
    let content = content
        .strip_prefix("```json")
        .or_else(|| content.strip_prefix("```"))
        .unwrap_or(content);
    let content = content.strip_suffix("```").unwrap_or(content);
    content.trim()
}

pub async fn fix_grammar_with_config(text: String, config: &AppSettings) -> Result<Correction, String> {
    if text.is_empty() {
        return Err("No text to fix after filtering.".to_string());
    }
    let base = effective_api_base(config);
    let key = if config.api_key.is_empty() {
        std::env::var("OPENAI_API_KEY").unwrap_or_else(|_| "ollama".to_string())
    } else {
        config.api_key.clone()
    };
    let model = if config.model.is_empty() {
        std::env::var("OPENAI_MODEL").unwrap_or_else(|_| default_model_for_base(base.trim()).to_string())
    } else {
        config.model.clone()
    };
    let system_prompt = if config.system_prompt.is_empty() {
        DEFAULT_SYSTEM_PROMPT.to_string()
    } else {
        config.system_prompt.clone()
    };

    let url = format!("{}/chat/completions", base.trim_end_matches('/'));
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|e| e.to_string())?;

    let req = ChatRequest {
        model,
        messages: vec![
            ChatMessage {
                role: "system".to_string(),
                content: system_prompt,
            },
            ChatMessage {
                role: "user".to_string(),
                content: format!("Fix the grammar and style of this text:\n\n{}", text),
            },
        ],
        response_format: Some(ResponseFormat {
            type_: "json_object".to_string(),
        }),
    };

    let user_message = &req.messages[1].content;
    println!("[API request] {}", user_message);

    let mut request_builder = client
        .post(&url)
        .json(&req);

    if !key.is_empty() {
        request_builder = request_builder.header("Authorization", format!("Bearer {}", key));
    }

    let response = request_builder
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("API error {}: {}", status, body));
    }

    let chat: ChatResponse = response
        .json()
        .await
        .map_err(|e| e.to_string())?;

    let content = chat
        .choices
        .first()
        .and_then(|c| c.message.content.as_deref())
        .ok_or("API returned no choices or content")?;

    let content = content.trim();
    println!("[API response] {}", content);

    let json_content = strip_markdown_code_fence(content);
    let corrected = match serde_json::from_str::<GrammarResponse>(json_content) {
        Ok(gr) => gr.corrected,
        Err(_) => json_content.to_string(),
    };

    Ok(Correction {
        original: text,
        corrected,
        explanation: None,
    })
}

/// Test the AI connection using current config (API key, model, effective base).
/// Sends a minimal chat request and returns Ok(()) if the API responds successfully.
pub async fn test_connection(config: &AppSettings) -> Result<(), String> {
    let base = effective_api_base(config);
    let key = if config.api_key.is_empty() {
        std::env::var("OPENAI_API_KEY").unwrap_or_else(|_| "ollama".to_string())
    } else {
        config.api_key.clone()
    };
    let model = if config.model.is_empty() {
        std::env::var("OPENAI_MODEL").unwrap_or_else(|_| default_model_for_base(base.trim()).to_string())
    } else {
        config.model.clone()
    };

    let url = format!("{}/chat/completions", base.trim_end_matches('/'));
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;

    let req = ChatRequest {
        model,
        messages: vec![
            ChatMessage {
                role: "system".to_string(),
                content: "Reply with only the word OK.".to_string(),
            },
            ChatMessage {
                role: "user".to_string(),
                content: "test".to_string(),
            },
        ],
        response_format: None,
    };

    let mut request_builder = client.post(&url).json(&req);
    if !key.is_empty() {
        request_builder = request_builder.header("Authorization", format!("Bearer {}", key));
    }

    let response = request_builder
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("API error {}: {}", status, body));
    }

    let chat: ChatResponse = response
        .json()
        .await
        .map_err(|e| e.to_string())?;

    if chat.choices.is_empty() {
        return Err("API returned no choices".to_string());
    }

    Ok(())
}
