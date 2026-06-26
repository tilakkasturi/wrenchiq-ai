/**
 * ShopObjectivesContext — shared, persistent shop objectives + ings
 *
 * - Hydrates from localStorage immediately (zero-flash on revisit)
 * - Fetches from API on mount and when shopId changes
 * - Writes back to localStorage after every successful fetch or add
 * - Exposes refresh() so login can trigger an explicit reload
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { extractIngEntities } from "../services/ingEntityExtractor";

const STORAGE_PREFIX = "wrenchiq_tribal_";
const API_BASE = import.meta.env.VITE_API_BASE || "";

// Shown when the API is unreachable (no MongoDB) — mirrors server DEMO_NOTES ings.
// entityData is pre-populated so the UI renders correctly before the LLM extraction runs.
const FALLBACK_INGS = [
  {
    _id: "fallback-ing-1", noteType: "ing", active: true,
    note: "Add shop supply fee ($29.95) to every RO before closing",
    entityData: { promotionType: "generic", conditions: {}, action: "Add shop supply fee before closing", discount: null, displayLabel: "Any Vehicle" },
  },
  {
    _id: "fallback-ing-2", noteType: "ing", active: true,
    note: "Offer alignment check on every tire rotation — alignment revenue is up 18% when presented",
    entityData: { promotionType: "service_based", conditions: { serviceType: "tire_rotation" }, action: "Offer alignment check on tire rotations", discount: null, displayLabel: "Tire Rotation" },
  },
  {
    _id: "fallback-ing-3", noteType: "ing", active: true,
    note: "Check cabin air filter on vehicles over 25K miles — we have 40 units in stock",
    entityData: { promotionType: "mileage_based", conditions: { mileageMin: 25000 }, action: "Check and offer cabin air filter", discount: null, displayLabel: "25K+ Miles" },
  },
  {
    _id: "fallback-ing-4", noteType: "ing", active: true,
    note: "Present Predii protection plan to first-time customers before checkout",
    entityData: { promotionType: "customer_segment", conditions: { customerSegment: "first_time" }, action: "Present protection plan at checkout", discount: null, displayLabel: "First-Time" },
  },
  {
    _id: "fallback-ing-5", noteType: "ing", active: true,
    note: "Remind customer about wiper blade replacement — offer both front + rear while vehicle is in",
    entityData: { promotionType: "generic", conditions: {}, action: "Offer wiper blade replacement", discount: null, displayLabel: "Any Vehicle" },
  },
  {
    _id: "fallback-ing-6", noteType: "ing", active: true,
    note: "Ford F-150: offer 10% off brake job — mention the promotion before presenting the estimate",
    entityData: { promotionType: "model_specific", conditions: { vehicleMake: "Ford", vehicleModel: "F-150" }, action: "Offer 10% off brake job", discount: "10%", displayLabel: "Ford F-150" },
  },
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
      const resolvedIngs = i.length > 0 ? i : FALLBACK_INGS;
      setObjectives(o);
      setIngs(resolvedIngs);
      setLoaded(true);
      enrichIngs(resolvedIngs); // async entity enrichment
    } else {
      setIngs(FALLBACK_INGS);
      setLoaded(false);
      enrichIngs(FALLBACK_INGS);
    }
  }, [shopId, enrichIngs]);

  // Run LLM entity extraction on ings that lack entityData, then update state
  const enrichIngs = useCallback(async (rawIngs) => {
    const enriched = await extractIngEntities(rawIngs).catch(() => rawIngs);
    setIngs(enriched);
  }, []);

  // Fetch from API on shopId change
  const fetchFromAPI = useCallback((sid) => {
    const id = sid || shopIdRef.current;
    fetch(`${API_BASE}/api/tribal-notes/${id}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (shopIdRef.current !== id) return; // stale
        const all = Array.isArray(data) ? data : [];
        const { objectives: o, ings: i } = split(all);
        const resolvedIngs = i.length > 0 ? i : FALLBACK_INGS;
        setObjectives(o);
        setIngs(resolvedIngs);      // show immediately
        setLoaded(true);
        writeCache(id, all);
        enrichIngs(resolvedIngs);   // extract entities async, updates state when done
      })
      .catch(() => {
        const resolvedIngs = FALLBACK_INGS;
        setIngs(resolvedIngs);
        setLoaded(true);
        enrichIngs(resolvedIngs);
      });
  }, [enrichIngs]);

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
