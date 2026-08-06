// WrenchIQ desktop shell — Tauri v2 application entry point.
//
// This wraps the existing "Surface B" web build (Vite `sidecar.html` -> `dist/sidecar.html`)
// as a native macOS desktop app. The notification plugin lets the sidecar post OS-level
// toasts for shop activity/insights while minimized (see WrenchIQSidecarScreen.jsx's
// insight simulator). The opener plugin lets the sidecar's settings gear icon launch
// Surface A (the web admin app) in the OS default browser, since the packaged webview
// only ever loads sidecar.html. Local data-feed cache / auth relay are still not
// implemented — see src-tauri/README.md for that follow-on.

use tauri::{Manager, PhysicalPosition, PhysicalSize, Position, Size};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Default placement: docked to the right edge of the primary display,
            // spanning its full height — a sidecar should sit alongside the shop's
            // SMS/DMS window, not float centered on top of it. tauri.conf.json's
            // width/height are just the pre-monitor-detection fallback for the
            // first paint; this is what actually determines placement on launch.
            // Starts hidden (tauri.conf.json `visible: false`) so this
            // resize+reposition never flashes the default centered placement
            // before snapping to the right edge.
            if let Some(window) = app.get_webview_window("main") {
                if let Ok(Some(monitor)) = window.primary_monitor() {
                    let monitor_size = *monitor.size();
                    let monitor_pos = *monitor.position();
                    let width = window
                        .outer_size()
                        .map(|s| s.width)
                        .unwrap_or(420);
                    let height = monitor_size.height;
                    let x = monitor_pos.x + (monitor_size.width as i32 - width as i32);
                    let y = monitor_pos.y;
                    let _ = window.set_size(Size::Physical(PhysicalSize::new(width, height)));
                    let _ = window.set_position(Position::Physical(PhysicalPosition::new(x, y)));
                }
                let _ = window.show();
                let _ = window.set_focus();
            }
            Ok(())
        })
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
