// WrenchIQ desktop shell — Tauri v2 application entry point.
//
// This wraps the existing "Surface B" web build (Vite `sidecar.html` -> `dist/sidecar.html`)
// as a native macOS desktop app. The notification plugin lets the sidecar post OS-level
// toasts for shop activity/insights while minimized (see WrenchIQSidecarScreen.jsx's
// insight simulator). The opener plugin lets the sidecar's settings gear icon launch
// Surface A (the web admin app) in the OS default browser, since the packaged webview
// only ever loads sidecar.html. Local data-feed cache / auth relay are still not
// implemented — see src-tauri/README.md for that follow-on.

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .build(tauri::generate_context!())
        .expect("error while building WrenchIQ tauri application")
        .run(|app_handle, event| {
            // macOS-only: fires when the app is reactivated (e.g. the user clicks a
            // notification this app posted, or its Dock icon) while no window is
            // visible. Bring the sidecar window back rather than leaving it minimized.
            if let tauri::RunEvent::Reopen { .. } = event {
                if let Some(window) = app_handle.get_webview_window("main") {
                    let _ = window.unminimize();
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        });
}
