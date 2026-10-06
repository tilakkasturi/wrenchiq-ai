// WrenchIQ desktop shell — Tauri v2 application entry point.
//
// This wraps the existing "Surface B" web build (Vite `sidecar.html` -> `dist/sidecar.html`)
// as a native macOS desktop app. The notification plugin lets the sidecar post OS-level
// toasts for shop activity/insights while minimized (see WrenchIQSidecarScreen.jsx's
// insight simulator). The opener plugin lets the sidecar's settings gear icon launch
// Surface A (the web admin app) in the OS default browser, since the packaged webview
// only ever loads sidecar.html. Local data-feed cache / auth relay are still not
// implemented — see src-tauri/README.md for that follow-on.
//
// Window mode ("sidecar" vs "full", see WrenchIQSidecarApp.jsx's header toggle and
// bin/tauri-app's `full` argument): the initial mode comes from the
// WRENCHIQ_WINDOW_MODE env var (set by bin/tauri-app), tracked afterward in the
// WindowModeState below so a later `window_mode` query (e.g. after the header toggle)
// reflects the latest value, not just what the process started with.
//
// The main window is looked up as a Window, not a WebviewWindow: while PartsTech is open it holds
// a second, native webview (the PartsTech tab, src/core/partstechView.js; Cargo feature
// "unstable"), and get_webview_window only finds windows with a single webview.

use std::env;
use std::sync::Mutex;
use tauri::webview::{PageLoadEvent, WebviewBuilder};
use tauri::{LogicalPosition, LogicalSize, Manager, PhysicalPosition, PhysicalSize, Position, Size, WebviewUrl, Window};

struct WindowModeState(Mutex<String>);

// Applies the geometry for `mode` to `window`. "sidecar" (default) docks to the
// right edge of the primary display, spanning its full height — a sidecar should
// sit alongside the shop's SMS/DMS window, not float centered on top of it. "full"
// takes the whole primary display instead, for the full-screen queue+intelligence
// layout (WrenchIQSidecarFullScreen.jsx).
fn apply_window_mode(window: &Window, mode: &str) {
    if let Ok(Some(monitor)) = window.primary_monitor() {
        let monitor_size = *monitor.size();
        let monitor_pos = *monitor.position();

        let (width, height, x, y) = if mode == "full" {
            (monitor_size.width, monitor_size.height, monitor_pos.x, monitor_pos.y)
        } else {
            let width = window.outer_size().map(|s| s.width).unwrap_or(420);
            let height = monitor_size.height;
            let x = monitor_pos.x + (monitor_size.width as i32 - width as i32);
            let y = monitor_pos.y;
            (width, height, x, y)
        };

        let _ = window.set_size(Size::Physical(PhysicalSize::new(width, height)));
        let _ = window.set_position(Position::Physical(PhysicalPosition::new(x, y)));
    }
}

// Returns the current window mode — read once by the frontend on launch to decide
// which layout (WrenchIQSidecarScreen vs WrenchIQSidecarFullScreen) to render.
#[tauri::command]
fn window_mode(state: tauri::State<WindowModeState>) -> String {
    state.0.lock().unwrap().clone()
}

// Called by the header mode-toggle to switch window mode live, without relaunching.
#[tauri::command]
fn set_window_mode(app: tauri::AppHandle, mode: String) -> Result<(), String> {
    if mode != "sidecar" && mode != "full" {
        return Err(format!("unknown window mode: {mode}"));
    }
    let window = app
        .get_window("main")
        .ok_or_else(|| "main window not found".to_string())?;
    apply_window_mode(&window, &mode);
    *app.state::<WindowModeState>().0.lock().unwrap() = mode;
    Ok(())
}

// Opens PartsTech as a native child webview over the PartsTech tab (src/core/partstechView.js).
// `url` is the punch-out session link, which signs the webview in (a first-party cookie, unlike an
// iframe in WKWebView). `then_url`, when given, is loaded once that first page has finished: the
// same search with the shop's filter (e.g. availability[]=Fastest Delivery), which the session link
// itself would drop. Position and size are logical pixels in the main window.
#[tauri::command]
async fn open_partstech(
    app: tauri::AppHandle,
    label: String,
    url: String,
    then_url: Option<String>,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    let window = app.get_window("main").ok_or_else(|| "main window not found".to_string())?;
    let start = url.parse().map_err(|e| format!("bad PartsTech url: {e}"))?;
    let then = Mutex::new(then_url);
    let builder = WebviewBuilder::new(&label, WebviewUrl::External(start)).on_page_load(move |webview, payload| {
        if payload.event() == PageLoadEvent::Finished {
            if let Some(next) = then.lock().unwrap().take() {
                if let Ok(next) = next.parse() {
                    let _ = webview.navigate(next);
                }
            }
        }
    });
    window
        .add_child(builder, LogicalPosition::new(x, y), LogicalSize::new(width, height))
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let initial_mode = env::var("WRENCHIQ_WINDOW_MODE").unwrap_or_else(|_| "sidecar".to_string());

    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .manage(WindowModeState(Mutex::new(initial_mode.clone())))
        .invoke_handler(tauri::generate_handler![window_mode, set_window_mode, open_partstech])
        .setup(move |app| {
            // Starts hidden (tauri.conf.json `visible: false`) so this
            // resize+reposition never flashes the default centered placement
            // before snapping into place.
            if let Some(window) = app.get_window("main") {
                apply_window_mode(&window, &initial_mode);
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
                if let Some(window) = app_handle.get_window("main") {
                    let _ = window.unminimize();
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        });
}
