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
