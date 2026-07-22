/**
 * insightNotifier — simulates shop activity / WrenchIQ insight events.
 *
 * Never changes the selected customer — a live demo relies on staying on
 * whichever customer the presenter picked. Events are exposed as state so
 * the Sidecar can render them as an in-app banner at the bottom of the
 * screen — no native OS notification, so nothing pops up outside the app
 * (and no OS notification permission is ever requested).
 */

import { useEffect, useState } from "react";

const INSIGHT_TEMPLATES = [
  (name) => ({ title: "Shop activity", body: `${name}'s RO just moved to the next stage.` }),
  (name) => ({ title: "WrenchIQ insight", body: `Service recommendation detected on ${name}'s RO.` }),
  (name) => ({ title: "WrenchIQ alert", body: `${name}'s RO has an overdue approval — advisor follow-up recommended.` }),
  (name) => ({ title: "WrenchIQ insight", body: `New DTC/TSB match found for ${name}'s vehicle.` }),
];

/**
 * @param {Array<{customerId: string, customerName: string}>} customers
 * @param {number} intervalMs
 * @returns {{ notifications: Array<{id: string, title: string, body: string, at: number, customerId: string}> }}
 */
export function useInsightNotifier(customers, intervalMs = 30000) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!customers || customers.length === 0) return;

    const id = setInterval(() => {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const template = INSIGHT_TEMPLATES[Math.floor(Math.random() * INSIGHT_TEMPLATES.length)];
      const event = template(customer.customerName || "A customer");

      // In-app bottom banner only — cap at the 3 most recent.
      setNotifications((prev) => [
        { id: `${Date.now()}-${Math.random()}`, at: Date.now(), customerId: customer.customerId, ...event },
        ...prev,
      ].slice(0, 3));
    }, intervalMs);

    return () => clearInterval(id);
  }, [customers, intervalMs]);

  return { notifications };
}
