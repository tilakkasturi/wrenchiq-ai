// WrenchIQ desktop shell — Tauri v2 application entry point.
//
// This wraps the existing "Surface B" web build (Vite `index.html` -> `dist/index.html`)
// as a native macOS desktop app. No native sidecar logic (local data-feed cache,
// auth relay) is implemented here yet — see src-tauri/README.md for that follow-on.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running WrenchIQ tauri application");
}
