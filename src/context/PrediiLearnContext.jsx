import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { runBatch, fetchShopProfile, fetchPersistedShopProfile } from "../services/prediiLearnService";
import { useDemo } from "./DemoContext";

export const PrediiLearnContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE || "";

// Full processing, not a sample: n is set to the real RO count for the
// selected window so "N of M" reflects the actual history being processed.
// SAFETY_CEILING is just a sanity backstop against a runaway count (e.g. an
// unfiltered "all shops" fetch), not a practical limiter for 1-3 year
// cornerstone windows (currently a few hundred to ~2,000 ROs).
const SAFETY_CEILING = 10000;

export function PrediiLearnProvider({ children }) {
  const { activeShopId } = useDemo();
  const [years, setYears] = useState(2);
  const [status, setStatus] = useState("idle"); // idle | running | done | error
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [results, setResults] = useState([]);
  const [shopProfile, setShopProfile] = useState(null);
  const [shopProfileLoading, setShopProfileLoading] = useState(false);
  const [error, setError] = useState(null);
  const [historyCounts, setHistoryCounts] = useState([]); // [{year, count}], most recent first
  const [historyLoading, setHistoryLoading] = useState(true);

  // Persisted Shop Intelligence profile (see shopProfileSnapshotService.js).
  // Lives here — not in the tab component — specifically so it survives
  // switching between Predii Learn's sub-tabs: that component unmounts on
  // every navigation away, and a fetch-on-mount there silently dropped the
  // profile on any transient failure (error was swallowed, remount reset
  // state to null) whenever the advisor came back to the Shop Intelligence
  // tab. Fetched once per shop here and reused across the whole session.
  const [persistedProfile, setPersistedProfile] = useState(null);
  const [persistedLoading, setPersistedLoading] = useState(true);
  const [persistedError, setPersistedError] = useState(null);
  const [persistedSavedAt, setPersistedSavedAt] = useState(null);

  const refreshPersistedProfile = useCallback(async (shopId) => {
    setPersistedLoading(true);
    setPersistedError(null);
    try {
      const data = await fetchPersistedShopProfile(shopId);
      setPersistedProfile(data.profile || null);
      setPersistedSavedAt(data.savedAt || null);
    } catch (err) {
      setPersistedError(err.message || "Failed to load persisted Shop Intelligence profile");
    } finally {
      setPersistedLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPersistedProfile(activeShopId);
  }, [activeShopId, refreshPersistedProfile]);

  const abortRef = useRef(null);

  const fetchHistoryCounts = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/repair-orders/history-count?shopId=${activeShopId}`);
      const json = res.ok ? await res.json() : null;
      if (Array.isArray(json) && json.length) setHistoryCounts(json);
    } catch {
      // leave historyCounts empty — UI falls back to a plain year selector
    } finally {
      setHistoryLoading(false);
    }
  }, [activeShopId]);

  useEffect(() => {
    fetchHistoryCounts();
  }, [fetchHistoryCounts]);

  // Real RO count for "last N years" = sum of the top N entries (they're
  // sorted most-recent-first by the server).
  const countForYears = useCallback(
    (n) => historyCounts.slice(0, n).reduce((sum, y) => sum + y.count, 0),
    [historyCounts]
  );

  const startRun = useCallback(async (runYears) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const realCount = countForYears(runYears);
    const n = realCount > 0 ? Math.min(realCount, SAFETY_CEILING) : SAFETY_CEILING;

    setYears(runYears);
    setStatus("running");
    setProgress(0);
    setCompleted(0);
    setTotal(0);
    setResults([]);
    setError(null);

    try {
      await runBatch({
        years: runYears,
        n,
        signal: controller.signal,
        onEvent: (event) => {
          setProgress(event.progress ?? 0);
          setCompleted(event.completed ?? 0);
          setTotal(event.total ?? 0);
          if (event.result) {
            setResults((prev) => [...prev, event.result]);
          }
        },
      });
      setStatus("done");
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Predii Learn run failed");
      setStatus("error");
    }
  }, [countForYears]);

  const loadShopProfile = useCallback(async (profileYears) => {
    setShopProfileLoading(true);
    try {
      const profile = await fetchShopProfile({ years: profileYears });
      setShopProfile(profile);
    } catch (err) {
      setError(err.message || "Failed to load shop profile");
    } finally {
      setShopProfileLoading(false);
    }
  }, []);

  const value = {
    years,
    status,
    progress,
    completed,
    total,
    results,
    shopProfile,
    shopProfileLoading,
    persistedProfile,
    persistedLoading,
    persistedError,
    persistedSavedAt,
    refreshPersistedProfile,
    error,
    startRun,
    loadShopProfile,
    historyCounts,
    historyLoading,
    countForYears,
  };

  return <PrediiLearnContext.Provider value={value}>{children}</PrediiLearnContext.Provider>;
}

export function usePrediiLearn() {
  const ctx = useContext(PrediiLearnContext);
  if (!ctx) throw new Error("usePrediiLearn must be used within a PrediiLearnProvider");
  return ctx;
}
