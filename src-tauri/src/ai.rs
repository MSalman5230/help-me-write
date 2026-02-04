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

#[derive(Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
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

#[derive(Deserialize)]
struct GrammarResponse {
    corrected: String,
    explanation: Option<String>,
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

fn load_config() -> Result<(String, String, String), String> {
    let base = std::env::var("OPENAI_API_BASE")
        .unwrap_or_else(|_| "http://localhost:11434/v1".to_string());
    let key = std::env::var("OPENAI_API_KEY").unwrap_or_else(|_| "ollama".to_string());
    let model = std::env::var("OPENAI_MODEL").unwrap_or_else(|_| {
        default_model_for_base(&base).to_string()
    });
    Ok((base, key, model))
}

const SYSTEM_PROMPT: &str = r#"You are a grammar and style fixer. Given the user's text, reply with ONLY a single JSON object (no other text, no markdown). Use this exact shape:
{"corrected": "<the corrected text>", "explanation": "<brief explanation of changes>"}
The "explanation" field may be null or a short string. Output nothing but valid JSON."#;

pub async fn fix_grammar(text: String) -> Result<Correction, String> {
    let (base, key, model) = load_config()?;

    let url = format!("{}/chat/completions", base.trim_end_matches('/'));
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|e| e.to_string())?;

    let req = ChatRequest {
        model: model.clone(),
        messages: vec![
            ChatMessage {
                role: "system".to_string(),
                content: SYSTEM_PROMPT.to_string(),
            },
            ChatMessage {
                role: "user".to_string(),
                content: format!("Fix the grammar and style of this text:\n\n{}", text),
            },
        ],
    };

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
    let (corrected, explanation) = match serde_json::from_str::<GrammarResponse>(content) {
        Ok(gr) => (gr.corrected, gr.explanation),
        Err(_) => (content.to_string(), Some("Could not parse explanation.".to_string())),
    };

    Ok(Correction {
        original: text,
        corrected,
        explanation,
    })
}
