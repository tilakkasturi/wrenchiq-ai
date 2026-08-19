// Lets the Sidecar (Surface B) tell the SMS/DMS Representative window
// (Surface C) "a story RO just changed, refetch now" instead of waiting for
// its 60s poll (see liveBoardFeed.js). Both windows are the same-origin app
// (either two Tauri WebviewWindows or two browser tabs in dev mode), so a
// BroadcastChannel is enough — no server push needed.
const CHANNEL_NAME = "wrenchiq-ro-updates";

export function notifyROUpdated(roId) {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.postMessage({ roId });
  channel.close();
}

export function subscribeROUpdates(onUpdate) {
  if (typeof BroadcastChannel === "undefined") return () => {};
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (e) => onUpdate(e.data);
  return () => channel.close();
}
