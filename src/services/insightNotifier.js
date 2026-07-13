/**
 * insightNotifier — fires native OS notifications (tauri-plugin-notification)
 * for simulated shop activity / WrenchIQ insights, so Surface B stays useful
 * while minimized. Also rotates SelectedCustomerContext's active customer in
 * lockstep, so whichever RO a notification calls out is already on screen by
 * the time the window is restored — the desktop notification plugin has no
 * click-through callback on macOS/Windows/Linux (only mobile emits an
 * actionPerformed event), so we can't deep-link a specific click, but this
 * keeps the sidecar's state consistent with the toast either way.
 *
 * No-ops outside a Tauri webview (e.g. sidecar.html opened in a plain browser tab).
 */

import { useEffect, useRef } from "react";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";

const INSIGHT_TEMPLATES = [
  (name) => ({ title: "Shop activity", body: `${name}'s RO just moved to the next stage.` }),
  (name) => ({ title: "WrenchIQ insight", body: `Service recommendation detected on ${name}'s RO.` }),
  (name) => ({ title: "WrenchIQ alert", body: `${name}'s RO has an overdue approval — advisor follow-up recommended.` }),
  (name) => ({ title: "WrenchIQ insight", body: `New DTC/TSB match found for ${name}'s vehicle.` }),
];

function isTauri() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * @param {Array<{customerId: string, customerName: string}>} customers
 * @param {(customerId: string) => void} selectCustomer
 * @param {number} intervalMs
 */
export function useInsightNotifier(customers, selectCustomer, intervalMs = 30000) {
  const permissionRef = useRef(false);

  useEffect(() => {
    if (!isTauri()) return;
    let cancelled = false;

    (async () => {
      let granted = await isPermissionGranted();
      if (!granted) granted = (await requestPermission()) === "granted";
      if (!cancelled) permissionRef.current = granted;
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isTauri()) return;
    if (!customers || customers.length === 0) return;

    const id = setInterval(() => {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      selectCustomer(customer.customerId);

      if (!permissionRef.current || document.hasFocus()) return; // only interrupt when minimized/backgrounded

      const template = INSIGHT_TEMPLATES[Math.floor(Math.random() * INSIGHT_TEMPLATES.length)];
      sendNotification(template(customer.customerName || "A customer"));
    }, intervalMs);

    return () => clearInterval(id);
  }, [customers, selectCustomer, intervalMs]);
}
