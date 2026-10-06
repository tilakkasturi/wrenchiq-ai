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
 * Where the page's (0,0) sits in the coordinates a child webview is placed in (the window's content,
 * from its top). The page can start lower than that: in full mode on macOS the window spans the
 * screen but the page starts below the menu bar (measured: window 899pt tall, page 867pt), so the
 * view landed 32pt too high, over the tab's header. Measured, not assumed: window height minus page
 * height (the page is bottom-aligned), and inner vs outer window position/size for a title bar.
 */
let origin = null;
async function pageOrigin() {
  if (origin) return origin;
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const w = getCurrentWindow();
  const [inner, outer, innerSize, outerSize, scale] = await Promise.all([w.innerPosition(), w.outerPosition(), w.innerSize(), w.outerSize(), w.scaleFactor()]);
  // macOS can report the same inner and outer position; the outer-minus-inner height is the title bar
  const byPos = (inner.y - outer.y) / scale, bySize = (outerSize.height - innerSize.height) / scale;
  const byPage = innerSize.height / scale - window.innerHeight; // window content taller than the page: the page starts lower
  origin = { x: Math.max(0, (inner.x - outer.x) / scale, innerSize.width / scale - window.innerWidth), y: Math.max(0, byPos, bySize, byPage) };
  log('page origin ' + JSON.stringify({ byPos, bySize, byPage, origin, scale, innerH: innerSize.height, outerH: outerSize.height, dpr: window.devicePixelRatio, innerHeight: window.innerHeight }));
  return origin;
}
// a resize or full/sidecar switch can change it; measure again next time
if (inTauri()) window.addEventListener('resize', () => { origin = null; });

/** A line in the Sidecar log (tauri dev terminal), for placement problems that only show in the app. */
async function log(msg) {
  try { const { invoke } = await import('@tauri-apps/api/core'); await invoke('partstech_log', { message: msg }); } catch { /* diagnostics only */ }
}

const GAP_Y = 10;

const labelFor = ref => 'partstech-' + String(ref).replace(/[^a-zA-Z0-9_-]/g, '');

// Created in Rust (src-tauri/src/lib.rs open_partstech): it opens the session link, which signs the
// view in, and only when that page has loaded switches to thenUrl (the search with the shop's filter);
// the JS Webview API cannot wait for a page load.
async function create(card, rect) {
  const [{ invoke }, { Webview }] = await Promise.all([import('@tauri-apps/api/core'), import('@tauri-apps/api/webview')]);
  const label = labelFor(card.ref);
  // already open (e.g. this module was hot-reloaded): reuse it, so it is moved rather than left in place
  const open = await Webview.getByLabel(label).catch(() => null);
  if (open) return open;
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
  // GAP_Y: extra room below the tab's header buttons (asked for on the Sidecar: 10 more pixels down);
  // the view gets that much shorter so its bottom edge stays put
  const rect = { ...pageRect, x: pageRect.x + o.x, y: pageRect.y + o.y + GAP_Y, height: pageRect.height - GAP_Y };
  log('place ' + card.ref.slice(0, 6) + ' slot ' + JSON.stringify(pageRect) + ' -> ' + JSON.stringify(rect));
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
