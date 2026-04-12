import { createContext, useContext, useState, useEffect, useCallback } from "react";

export const RecommendationsContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE || "";

export function RecommendationsProvider({ shopId, edition, persona, children }) {
  const [allRecommendations, setAllRecommendations] = useState([]);
  const [loading, setLoading]                       = useState(true);
  const [error, setError]                           = useState(null);
  const [generatedAt, setGeneratedAt]               = useState(null);
  const [dismissedIds, setDismissedIds]             = useState(new Set());

  useEffect(() => {
    let cancelled = false;

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 15000);

    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/recommendations`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ shopId, edition, persona }),
      signal: controller.signal,
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (cancelled) return;
        setAllRecommendations(data.recommendations || []);
        setGeneratedAt(data.generatedAt || new Date().toISOString());
      })
      .catch(err => {
        if (cancelled) return;
        if (err.name === "AbortError") {
          setError("timeout");
        } else {
          setError(err.message || "error");
        }
        // Fall back to empty — WrenchIQAgent handles its own fallback display
        setAllRecommendations([]);
      })
      .finally(() => {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [shopId, edition, persona]);

  const dismissRecommendation = useCallback((id) => {
    setDismissedIds(prev => new Set([...prev, id]));
  }, []);

  // Filtered recommendations (dismissed items removed)
  const recommendations = allRecommendations.filter(r => !dismissedIds.has(r.id));

  const getForScreen = useCallback((screenId) => {
    return recommendations.filter(
      r => r.priority === "high" && Array.isArray(r.screenContext) && r.screenContext.includes(screenId)
    );
  }, [recommendations]);

  const getForRO = useCallback((roNumber) => {
    if (!roNumber) return [];
    return recommendations.filter(
      r => r.priority === "high" && r.roNumber === roNumber
    );
  }, [recommendations]);

  return (
    <RecommendationsContext.Provider value={{
      recommendations,
      loading,
      error,
      generatedAt,
      dismissRecommendation,
      getForScreen,
      getForRO,
    }}>
      {children}
    </RecommendationsContext.Provider>
  );
}

export function useRecommendations() {
  return useContext(RecommendationsContext);
}
