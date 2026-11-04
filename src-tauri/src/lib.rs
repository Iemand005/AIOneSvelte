mod aione;

use aione::AioneState;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(AioneState::default())
        .invoke_handler(tauri::generate_handler![
            greet,
            aione::aione_create_session,
            aione::aione_load_model,
            aione::aione_generate,
            aione::aione_cancel_generation,
            aione::aione_format_chat_prompt,
            aione::aione_unload_model,
            aione::aione_is_loaded,
            aione::aione_destroy_session,
            aione::aione_system_info,
            aione::aione_chat_list,
            aione::aione_chat_create,
            aione::aione_chat_load,
            aione::aione_chat_append,
            aione::aione_chat_update,
            aione::aione_chat_delete,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
