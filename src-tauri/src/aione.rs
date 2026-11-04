use std::sync::{Arc, Mutex, MutexGuard};

use serde::Serialize;
use tauri::{AppHandle, Emitter, State};

use aione_rs::{
    ChatData, ChatMessage, ChatMetadata, GenerateCallbacks, GenerateResult, Session,
};

#[derive(Default, Clone)]
pub struct AioneState {
    session: Arc<Mutex<Option<Session>>>,
}

#[derive(Clone, Serialize)]
struct TokenEvent {
    token: String,
    thinking: bool,
}

fn ensure_session(session: &mut Option<Session>) -> Result<&mut Session, String> {
    if session.is_none() {
        *session = Some(Session::new().map_err(|error| error.to_string())?);
    }

    Ok(session.as_mut().expect("session was initialized"))
}

fn lock_session(
    session: &Mutex<Option<Session>>,
) -> Result<MutexGuard<'_, Option<Session>>, String> {
    session
        .lock()
        .map_err(|_| String::from("AIOne session lock poisoned"))
}

async fn run_blocking<T, F>(task: F) -> Result<T, String>
where
    T: Send + 'static,
    F: FnOnce() -> Result<T, String> + Send + 'static,
{
    tauri::async_runtime::spawn_blocking(task)
        .await
        .map_err(|error| format!("AIOne task failed: {error}"))?
}

#[tauri::command]
pub async fn aione_create_session(state: State<'_, AioneState>) -> Result<(), String> {
    let session_slot = state.session.clone();
    drop(state);

    run_blocking(move || {
        let mut session = lock_session(&session_slot)?;
        ensure_session(&mut session)?;
        Ok(())
    })
    .await
}

#[tauri::command]
pub async fn aione_load_model(
    app: AppHandle,
    state: State<'_, AioneState>,
    path: String,
) -> Result<bool, String> {
    let session_slot = state.session.clone();
    drop(state);

    run_blocking(move || {
        let mut session = lock_session(&session_slot)?;
        let session = ensure_session(&mut session)?;

        let progress_app = app.clone();
        session
            .load_model(&path, move |progress| {
                let _ = progress_app.emit("aione-model-progress", progress);
            })
            .map_err(|error| error.to_string())?;

        Ok(session.is_loaded())
    })
    .await
}

#[tauri::command]
pub async fn aione_generate(
    app: AppHandle,
    state: State<'_, AioneState>,
    prompt: String,
    max_tokens: u32,
) -> Result<GenerateResult, String> {
    let session_slot = state.session.clone();
    drop(state);

    run_blocking(move || {
        let mut session = lock_session(&session_slot)?;
        let session = ensure_session(&mut session)?;

        let mut callbacks = GenerateCallbacks::default();

        let token_app = app.clone();
        callbacks.on_token_reasoning = Some(Box::new(move |token, thinking| {
            let _ = token_app.emit(
                "aione-token",
                TokenEvent {
                    token: token.to_string(),
                    thinking,
                },
            );
        }));

        let input_app = app.clone();
        callbacks.on_input_eval = Some(Box::new(move |progress| {
            let _ = input_app.emit("aione-input-eval", progress);
        }));

        let start_app = app.clone();
        callbacks.on_generation_start = Some(Box::new(move || {
            let _ = start_app.emit("aione-generation-start", ());
        }));

        let think_app = app.clone();
        callbacks.on_think_state_change = Some(Box::new(move |thinking| {
            let _ = think_app.emit("aione-think-state", thinking);
        }));

        session
            .generate(&prompt, max_tokens, &mut callbacks)
            .map_err(|error| error.to_string())
    })
    .await
}

#[tauri::command]
pub async fn aione_unload_model(state: State<'_, AioneState>) -> Result<(), String> {
    let session_slot = state.session.clone();
    drop(state);

    run_blocking(move || {
        let session = lock_session(&session_slot)?;

        if let Some(session) = session.as_ref() {
            session.unload_model();
        }

        Ok(())
    })
    .await
}

#[tauri::command]
pub async fn aione_is_loaded(state: State<'_, AioneState>) -> Result<bool, String> {
    let session_slot = state.session.clone();
    drop(state);

    run_blocking(move || {
        let session = lock_session(&session_slot)?;
        Ok(session.as_ref().map(Session::is_loaded).unwrap_or(false))
    })
    .await
}

#[tauri::command]
pub async fn aione_destroy_session(state: State<'_, AioneState>) -> Result<(), String> {
    let session_slot = state.session.clone();
    drop(state);

    run_blocking(move || {
        let mut session = lock_session(&session_slot)?;
        *session = None;
        Ok(())
    })
    .await
}

#[tauri::command]
pub async fn aione_system_info() -> Result<serde_json::Value, String> {
    run_blocking(|| aione_rs::system_info().map_err(|error| error.to_string())).await
}

#[tauri::command]
pub async fn aione_chat_list() -> Result<Vec<ChatMetadata>, String> {
    run_blocking(|| aione_rs::list_chats().map_err(|error| error.to_string())).await
}

#[tauri::command]
pub async fn aione_chat_create(
    title: String,
    model: String,
    system_prompt: String,
) -> Result<ChatMetadata, String> {
    run_blocking(move || {
        aione_rs::create_chat(&title, &model, &system_prompt).map_err(|error| error.to_string())
    })
    .await
}

#[tauri::command]
pub async fn aione_chat_load(folder: String) -> Result<ChatData, String> {
    run_blocking(move || aione_rs::load_chat(&folder).map_err(|error| error.to_string())).await
}

#[tauri::command]
pub async fn aione_chat_append(
    folder: String,
    role: String,
    content: String,
    parent_id: Option<u64>,
) -> Result<ChatMessage, String> {
    run_blocking(move || {
        aione_rs::append_message_with_parent(
            &folder,
            &role,
            &content,
            parent_id.unwrap_or(0),
        )
        .map_err(|error| error.to_string())
    })
    .await
}

#[tauri::command]
pub async fn aione_chat_update(
    folder: String,
    title: Option<String>,
    model: Option<String>,
    system_prompt: Option<String>,
) -> Result<(), String> {
    run_blocking(move || {
        aione_rs::update_chat_metadata(
            &folder,
            title.as_deref(),
            model.as_deref(),
            system_prompt.as_deref(),
        )
        .map_err(|error| error.to_string())
    })
    .await
}

#[tauri::command]
pub async fn aione_chat_delete(folder: String) -> Result<(), String> {
    run_blocking(move || aione_rs::delete_chat(&folder).map_err(|error| error.to_string())).await
}
