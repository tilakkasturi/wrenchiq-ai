// Opens an external URL. Tauri's webview can't open external URLs via plain
// window.open, so we route through the opener plugin when running inside
// the desktop shell, falling back to window.open for browser-based dev.
export async function openExternalUrl(url) {
  const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
  if (isTauri) {
    const { openUrl } = await import("@tauri-apps/plugin-opener");
    openUrl(url);
  } else {
    window.open(url, "_blank");
  }
}

const SMS_WINDOW_LABEL = "sms-representative";
const ADMIN_SETTINGS_WINDOW_LABEL = "admin-settings";

// Window mode ("sidecar" — narrow docked panel — vs "full" — full-screen
// queue+intelligence+chat layout, see WrenchIQSidecarFullScreen.jsx). The
// native window geometry lives in src-tauri/src/lib.rs; these two functions
// are the frontend's only touchpoint with it. Outside Tauri (plain-browser
// dev), there's no native window to resize, so getWindowMode() falls back to
// a `?mode=full` URL param for a quick layout preview and setWindowMode() is
// a no-op.
export async function getWindowMode() {
  const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
  if (!isTauri) {
    return new URLSearchParams(window.location.search).get("mode") === "full" ? "full" : "sidecar";
  }
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return (await invoke("window_mode")) || "sidecar";
  } catch {
    return "sidecar";
  }
}

export async function setWindowMode(mode) {
  const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
  if (!isTauri) return;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("set_window_mode", { mode });
  } catch {
    // best-effort — the React layout still switches even if the native
    // window resize fails for some reason
  }
}

// Opens Admin Settings as a Tauri WebviewWindow in this same app instance,
// instead of the OS default browser (openExternalUrl) — admin.html needs to
// share the Sidecar's localStorage (DemoContext's "wrenchiq_demo_config" key)
// so a change made there (e.g. picking a different SMS/DMS in Settings ->
// Learn -> Integrations) reaches the Sidecar via DemoContext's cross-window
// "storage" event listener. A window opened in the system browser is a
// different origin/process with its own localStorage, so that sync silently
// never happens — see openSmsRepresentativeSplit above for the same
// same-app-instance requirement. Falls back to openExternalUrl outside Tauri
// (dev-in-browser) or if window creation fails for any reason.
export async function openAdminSettingsWindow(url) {
  const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
  if (!isTauri) {
    openExternalUrl(url);
    return;
  }

  try {
    const { WebviewWindow } = await import("@tauri-apps/api/window");

    const existing = await WebviewWindow.getByLabel(ADMIN_SETTINGS_WINDOW_LABEL);
    if (existing) {
      await existing.setFocus();
      return;
    }

    const adminWindow = new WebviewWindow(ADMIN_SETTINGS_WINDOW_LABEL, {
      url,
      title: "WrenchIQ Admin Settings",
      width: 1200,
      height: 860,
      resizable: true,
    });
    adminWindow.once("tauri://error", () => openExternalUrl(url));
  } catch {
    openExternalUrl(url);
  }
}

// Opens the SMS/DMS Representative surface docked to the left edge of the
// screen, sized so smsWidth + sidecarWidth == full screen width, with the
// Sidecar (this window) pinned to the right edge to fill the remainder —
// the two windows tile the display exactly, no gap/overlap. Only possible
// inside the Tauri shell, where we can query the monitor and both windows'
// geometry; falls back to a plain external-browser open otherwise (dev mode,
// or if window-management APIs aren't available for any reason).
export async function openSmsRepresentativeSplit(url) {
  const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
  if (!isTauri) {
    const w = window.screen?.availWidth || window.innerWidth;
    const h = window.screen?.availHeight || window.innerHeight;
    window.open(url, "_blank", `width=${Math.round(w * 0.7)},height=${h},left=0,top=0`);
    return;
  }

  try {
    const { getCurrentWindow, WebviewWindow, LogicalSize, LogicalPosition } = await import("@tauri-apps/api/window");
    const sidecar = getCurrentWindow();

    const monitor = await sidecar.currentMonitor();
    if (!monitor) throw new Error("no monitor info available");

    const scale = monitor.scaleFactor || 1;
    const screenX = monitor.position.x / scale;
    const screenY = monitor.position.y / scale;
    const screenWidth = monitor.size.width / scale;
    const screenHeight = monitor.size.height / scale;

    const sidecarSize = await sidecar.outerSize();
    const sidecarWidth = sidecarSize.width / scale;
    const smsWidth = Math.max(320, screenWidth - sidecarWidth);

    // Pin the Sidecar to the right edge, full screen height...
    await sidecar.setPosition(new LogicalPosition(screenX + screenWidth - sidecarWidth, screenY));
    await sidecar.setSize(new LogicalSize(sidecarWidth, screenHeight));

    // ...and the SMS Representative window fills the rest, on the left.
    const existing = await WebviewWindow.getByLabel(SMS_WINDOW_LABEL);
    if (existing) {
      await existing.setPosition(new LogicalPosition(screenX, screenY));
      await existing.setSize(new LogicalSize(smsWidth, screenHeight));
      await existing.setFocus();
      return;
    }

    const smsWindow = new WebviewWindow(SMS_WINDOW_LABEL, {
      url,
      title: "SMS / DMS Representative",
      x: screenX,
      y: screenY,
      width: smsWidth,
      height: screenHeight,
      resizable: true,
    });
    smsWindow.once("tauri://error", () => openExternalUrl(url));
  } catch {
    // Monitor/window APIs unavailable (e.g. permission not granted in this
    // build) — fall back to the old behavior rather than failing silently.
    openExternalUrl(url);
  }
}
