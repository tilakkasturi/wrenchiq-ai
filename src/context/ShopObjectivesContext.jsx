/**
 * ShopObjectivesContext — shared, persistent shop objectives + ings
 *
 * - Hydrates from localStorage immediately (zero-flash on revisit)
 * - Fetches from API on mount and when shopId changes
 * - Writes back to localStorage after every successful fetch or add
 * - Exposes refresh() so login can trigger an explicit reload
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

const STORAGE_PREFIX = "wrenchiq_tribal_";
const API_BASE = import.meta.env.VITE_API_BASE || "";

// Shown when the API is unreachable (no MongoDB) — mirrors server DEMO_NOTES ings
const FALLBACK_INGS = [
  { _id: "fallback-ing-1", noteType: "ing", active: true, expiresAt: null, triggerType: "any_ro",
    note: "Add shop supply fee ($29.95) to every RO before closing" },
  { _id: "fallback-ing-2", noteType: "ing", active: true, expiresAt: null, triggerType: "any_ro",
    note: "Offer alignment check on every tire rotation — alignment revenue is up 18% when presented" },
  { _id: "fallback-ing-3", noteType: "ing", active: true, expiresAt: null, triggerType: "mileage_range:25000-999999",
    note: "Check cabin air filter on vehicles over 25K miles — we have 40 units in stock" },
  { _id: "fallback-ing-4", noteType: "ing", active: true, expiresAt: null, triggerType: "any_ro",
    note: "Present Predii protection plan to first-time customers before checkout" },
];

const ShopObjectivesContext = createContext(null);

function storageKey(shopId) {
  return `${STORAGE_PREFIX}${shopId}`;
}

function readCache(shopId) {
  try {
    const raw = localStorage.getItem(storageKey(shopId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(shopId, all) {
  try {
    localStorage.setItem(storageKey(shopId), JSON.stringify(all));
  } catch {}
}

function split(all) {
  const arr = Array.isArray(all) ? all : [];
  return {
    objectives: arr.filter(n => !n.noteType || n.noteType === "objective"),
    ings:       arr.filter(n => n.noteType === "ing"),
  };
}

export function ShopObjectivesProvider({ shopId = "cornerstone", children }) {
  const [objectives, setObjectives] = useState([]);
  const [ings, setIngs]             = useState([]);
  const [loaded, setLoaded]         = useState(false);
  const shopIdRef = useRef(shopId);

  // Hydrate from localStorage synchronously on shopId change
  useEffect(() => {
    shopIdRef.current = shopId;
    const cached = readCache(shopId);
    if (cached) {
      const { objectives: o, ings: i } = split(cached);
      setObjectives(o);
      setIngs(i.length > 0 ? i : FALLBACK_INGS);
      setLoaded(true);
    } else {
      setIngs(FALLBACK_INGS);
      setLoaded(false);
    }
  }, [shopId]);

  // Fetch from API on shopId change
  const fetchFromAPI = useCallback((sid) => {
    const id = sid || shopIdRef.current;
    fetch(`${API_BASE}/api/tribal-notes/${id}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (shopIdRef.current !== id) return; // stale
        const all = Array.isArray(data) ? data : [];
        const { objectives: o, ings: i } = split(all);
        setObjectives(o);
        setIngs(i.length > 0 ? i : FALLBACK_INGS);
        setLoaded(true);
        writeCache(id, all);
      })
      .catch(() => {
        setIngs(prev => prev.length > 0 ? prev : FALLBACK_INGS);
        setLoaded(true);
      });
  }, []);

  useEffect(() => {
    fetchFromAPI(shopId);
  }, [shopId, fetchFromAPI]);

  // Called by login handler for an explicit refresh
  const refresh = useCallback(() => fetchFromAPI(shopIdRef.current), [fetchFromAPI]);

  // Add a new objective and immediately reflect it locally + persist
  const addObjective = useCallback((note) => {
    setObjectives(prev => {
      const next = [...prev, note];
      const all  = [...next, ...ings];
      writeCache(shopIdRef.current, all);
      return next;
    });
  }, [ings]);

  return (
    <ShopObjectivesContext.Provider value={{ objectives, ings, loaded, refresh, addObjective }}>
      {children}
    </ShopObjectivesContext.Provider>
  );
}

export function useShopObjectives() {
  const ctx = useContext(ShopObjectivesContext);
  if (!ctx) throw new Error("useShopObjectives must be used inside ShopObjectivesProvider");
  return ctx;
}
