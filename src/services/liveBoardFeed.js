/**
 * liveBoardFeed — polls the shop's real Data Feed (the same
 * /api/data-feed/customers endpoint Surface B's CustomerSelector uses) and
 * resolves each listed RO to its full record via
 * /api/repair-orders/story-ro/:roId. Any Surface C screen consuming this
 * hook sees the same repair orders Surface B sees, rather than a separate
 * static or simulated dataset.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { fetchStoryRO } from "./repairOrderService";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export function useLiveBoardROs({ shopId, edition = "am", limit = 20, intervalMs = 60000 } = {}) {
  const [ros, setRos]         = useState(null); // null = not yet loaded / feed unavailable — callers should fall back to their own static data
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

  const fetchBoard = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (shopId)  params.set("shopId", shopId);
      if (edition) params.set("edition", edition);
      params.set("limit", String(limit));
      // Every result here gets resolved via /story-ro/:roId, which 404s on
      // anything without isStoryRO:true — ask the feed to only hand back IDs
      // that can actually resolve (see dataFeedService.js listActiveCustomers).
      params.set("storyOnly", "true");

      const res = await fetch(`${API_BASE}/api/data-feed/customers?${params}`);
      if (!res.ok) return;
      const { data } = await res.json();
      const roNumbers = [...new Set((data || []).map((r) => r.roNumber).filter(Boolean))];
      if (!roNumbers.length) return;

      const fullROs = (
        await Promise.all(roNumbers.map((n) => fetchStoryRO(n).catch(() => null)))
      ).filter(Boolean);

      if (fullROs.length) setRos(fullROs);
    } catch {
      // transient failure — keep whatever we last had (or null, meaning "use static fallback")
    } finally {
      setLoading(false);
    }
  }, [shopId, edition, limit]);

  useEffect(() => {
    fetchBoard();
    pollRef.current = setInterval(fetchBoard, intervalMs);
    return () => clearInterval(pollRef.current);
  }, [fetchBoard, intervalMs]);

  return { ros, loading };
}
