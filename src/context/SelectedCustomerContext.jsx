/**
 * SelectedCustomerContext — shared "current customer" selection state
 *
 * Backs the Data Feed Model's default-to-most-recently-updated-customer
 * behavior with a manual override via the Customer Selector. Consumed by
 * ARO, the Advisor Job Flow (Intake/3C/Upsell), Intelligent RO, and Copilot
 * so all four stay in sync on the same selection.
 *
 * - No override: activeCustomer tracks the data feed's most-recently-updated
 *   customer, refreshed on an interval.
 * - Override: activeCustomer is pinned to the selected customer until cleared.
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

export const SelectedCustomerContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE || "";
const REFRESH_INTERVAL_MS = 60000;

export function SelectedCustomerProvider({ shopId, edition, children }) {
  const [mostRecent, setMostRecent]           = useState(null);
  const [customers, setCustomers]             = useState([]);
  const [selectedCustomerId, setSelectedId]   = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);
  const pollRef = useRef(null);

  const fetchFeed = useCallback(async () => {
    const params = new URLSearchParams();
    if (shopId) params.set("shopId", shopId);
    if (edition) params.set("edition", edition);
    // Every consumer of this context (ARO, Job Flow, Copilot, the Sidecar's
    // RO Queue) eventually resolves the pick via /story-ro/:roId, which
    // 404s on anything without isStoryRO:true — restrict to the resolvable
    // set so this stays in parity with the SMS-representative surface's
    // live feed (see liveBoardFeed.js).
    params.set("storyOnly", "true");

    try {
      const [mostRecentRes, customersRes] = await Promise.all([
        fetch(`${API_BASE}/api/data-feed/most-recent-customer?${params}`),
        fetch(`${API_BASE}/api/data-feed/customers?${params}`),
      ]);

      const mostRecentJson = mostRecentRes.ok ? await mostRecentRes.json() : null;
      const customersJson  = customersRes.ok  ? await customersRes.json()  : null;

      setMostRecent(mostRecentJson?.found ? mostRecentJson.data : null);
      setCustomers(customersJson?.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || "error");
    } finally {
      setLoading(false);
    }
  }, [shopId, edition]);

  useEffect(() => {
    fetchFeed();
    pollRef.current = setInterval(fetchFeed, REFRESH_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [fetchFeed]);

  const selectCustomer = useCallback((customerId) => {
    setSelectedId(customerId);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedId(null);
  }, []);

  const selectedCustomer = selectedCustomerId
    ? customers.find(c => c.customerId === selectedCustomerId) || null
    : null;

  // Falls back to most-recent if the override no longer matches a known customer
  const activeCustomer = selectedCustomer || mostRecent;

  return (
    <SelectedCustomerContext.Provider value={{
      activeCustomer,
      customers,
      selectedCustomerId,
      selectCustomer,
      clearSelection,
      loading,
      error,
      refresh: fetchFeed,
    }}>
      {children}
    </SelectedCustomerContext.Provider>
  );
}

export function useSelectedCustomer() {
  const ctx = useContext(SelectedCustomerContext);
  if (!ctx) throw new Error("useSelectedCustomer must be used inside SelectedCustomerProvider");
  return ctx;
}
