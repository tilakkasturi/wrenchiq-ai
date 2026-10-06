// PartsTech inside the PartsTech tab, in the Tauri Sidecar: a native child webview laid over the
// tab's frame area, instead of an <iframe>. In an iframe PartsTech's sign-in cookie is a third-party
// cookie, which WKWebView blocks, so PartsTech loads signed out; as its own webview it is first-party
// and the punch-out link signs it in. Needs Tauri's "unstable" feature (multi-webview, see
// src-tauri/Cargo.toml) and the core:webview permissions in src-tauri/capabilities/default.json.
// One webview per PartsTech session, kept (hidden) while another tab or session is in front, so
// the advisor's search and cart survive. Outside Tauri every function is a no-op and the panel
// uses an iframe.

import { partstechFilteredUrl } from './partPolicy';

export const inTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

const views = new Map(); // ref -> Promise<Webview | null>
let shown = null;         // ref of the view in front

/**
 * Where the page's (0,0) sits in the coordinates a child webview is placed in. On macOS those are
 * the whole window, title bar included, while getBoundingClientRect() is from below the title bar,
 * so without this the view sits one title bar too high (over the tab's header). Measured from the
 * window (inner vs outer position), not assumed.
 */
let origin = null;
async function pageOrigin() {
  if (origin) return origin;
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const w = getCurrentWindow();
  const [inner, outer, innerSize, outerSize, scale] = await Promise.all([w.innerPosition(), w.outerPosition(), w.innerSize(), w.outerSize(), w.scaleFactor()]);
  // macOS can report the same inner and outer position; the outer-minus-inner height is the title bar
  const byPos = (inner.y - outer.y) / scale, bySize = (outerSize.height - innerSize.height) / scale;
  origin = { x: Math.max(0, (inner.x - outer.x) / scale), y: Math.max(0, byPos, bySize) };
  console.log('[partstech] page origin in the window', { byPos, bySize, origin, scale });
  return origin;
}
// a resize or full/sidecar switch can change it; measure again next time
if (inTauri()) window.addEventListener('resize', () => { origin = null; });

const labelFor = ref => 'partstech-' + String(ref).replace(/[^a-zA-Z0-9_-]/g, '');

// Created in Rust (src-tauri/src/lib.rs open_partstech): it opens the session link, which signs the
// view in, and only when that page has loaded switches to thenUrl (the search with the shop's filter);
// the JS Webview API cannot wait for a page load.
async function create(card, rect) {
  const [{ invoke }, { Webview }] = await Promise.all([import('@tauri-apps/api/core'), import('@tauri-apps/api/webview')]);
  const label = labelFor(card.ref);
  try {
    await invoke('open_partstech', { label, url: card.redirectUrl, thenUrl: partstechFilteredUrl(card), ...rect });
    return await Webview.getByLabel(label);
  } catch (e) {
    console.error('[partstech] native view failed', e);
    return null;
  }
}

/** Show the session's PartsTech view over pageRect ({x, y, width, height}: getBoundingClientRect of the slot); creates it once. */
export async function placePartstechView(card, pageRect) {
  if (!inTauri() || !card || pageRect.width < 1 || pageRect.height < 1) return;
  const o = await pageOrigin();
  const rect = { ...pageRect, x: pageRect.x + o.x, y: pageRect.y + o.y };
  if (shown && shown !== card.ref) await hidePartstechView();
  if (!views.has(card.ref)) views.set(card.ref, create(card, rect));
  const view = await views.get(card.ref);
  if (!view) { views.delete(card.ref); return; }
  const { LogicalPosition, LogicalSize } = await import('@tauri-apps/api/dpi');
  await view.setPosition(new LogicalPosition(rect.x, rect.y));
  await view.setSize(new LogicalSize(rect.width, rect.height));
  await view.show();
  shown = card.ref;
}

/** Hide the view in front (another tab is showing); it stays loaded. */
export async function hidePartstechView() {
  if (!inTauri() || !shown) return;
  const view = await views.get(shown);
  shown = null;
  if (view) await view.hide().catch(() => {});
}

/** Close one session's view (its parts went back to the RO); opening it again starts a fresh view. */
export async function closePartstechView(ref) {
  if (!inTauri() || !views.has(ref)) return;
  const p = views.get(ref);
  views.delete(ref);
  if (shown === ref) shown = null;
  const v = await p;
  if (v) await v.close().catch(() => {});
}

/** Close every PartsTech view (a new job). */
export async function closePartstechViews() {
  if (!inTauri()) return;
  const all = [...views.values()];
  views.clear(); shown = null;
  for (const p of all) { const v = await p; if (v) await v.close().catch(() => {}); }
}
