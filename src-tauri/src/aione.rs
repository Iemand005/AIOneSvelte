use std::sync::Mutex;

use serde::Serialize;
use tauri::{AppHandle, Emitter, State};

use crate::aione_ffi::{GenerateCallbacks, GenerateResult, Session};

#[derive(Default)]
pub struct AioneState {
    session: Mutex<Option<Session>>,
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

fn lock_state(state: &AioneState) -> Result<std::sync::MutexGuard<'_, Option<Session>>, String> {
    state
        .session
        .lock()
        .map_err(|_| String::from("AIOne session lock poisoned"))
}

#[tauri::command]
pub fn aione_create_session(state: State<'_, AioneState>) -> Result<(), String> {
    let mut session = lock_state(&state)?;
    ensure_session(&mut session)?;
    Ok(())
}

#[tauri::command]
pub fn aione_load_model(
    app: AppHandle,
    state: State<'_, AioneState>,
    path: String,
) -> Result<bool, String> {
    let mut session = lock_state(&state)?;
    let session = ensure_session(&mut session)?;

    let progress_app = app.clone();
    session
        .load_model(&path, move |progress| {
            let _ = progress_app.emit("aione-model-progress", progress);
        })
        .map_err(|error| error.to_string())?;

    Ok(session.is_loaded())
}

#[tauri::command]
pub fn aione_generate(
    app: AppHandle,
    state: State<'_, AioneState>,
    prompt: String,
    max_tokens: u32,
) -> Result<GenerateResult, String> {
    let mut session = lock_state(&state)?;
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
}

#[tauri::command]
pub fn aione_unload_model(state: State<'_, AioneState>) -> Result<(), String> {
    let session = lock_state(&state)?;

    if let Some(session) = session.as_ref() {
        session.unload_model();
    }

    Ok(())
}

#[tauri::command]
pub fn aione_is_loaded(state: State<'_, AioneState>) -> Result<bool, String> {
    let session = lock_state(&state)?;
    Ok(session.as_ref().map(Session::is_loaded).unwrap_or(false))
}

#[tauri::command]
pub fn aione_destroy_session(state: State<'_, AioneState>) -> Result<(), String> {
    let mut session = lock_state(&state)?;
    *session = None;
    Ok(())
}
