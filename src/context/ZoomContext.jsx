import { createContext, useCallback, useContext, useMemo, useState } from "react";

// Body-text zoom for the WrenchIQ Sidecar — readability aid separate from
// the OS/browser zoom. Scoped to body/description text inside each tab's
// sections (advisor briefs, recommendation reasons, guideline descriptions,
// chat bubbles, etc.) — section labels/titles (the small uppercase eyebrow
// headers like "SERVICE RECOMMENDATIONS", "RO SCORE") intentionally opt out
// by not calling bz(), so the visual hierarchy between label and content
// stays intact as body text grows.
const STEP = 0.15;
const MIN_ZOOM = 1;
const MAX_ZOOM = 1.6;

const ZoomContext = createContext(null);

export function ZoomProvider({ children }) {
  const [zoom, setZoom] = useState(1);

  const zoomIn = useCallback(() => setZoom((z) => Math.min(MAX_ZOOM, Math.round((z + STEP) * 100) / 100)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(MIN_ZOOM, Math.round((z - STEP) * 100) / 100)), []);
  // Rounds to the nearest whole pixel — half-pixel font sizes render
  // inconsistently across the sizes used throughout the Sidecar (9-14px).
  const bz = useCallback((px) => Math.round(px * zoom), [zoom]);

  const value = useMemo(() => ({
    zoom, zoomIn, zoomOut, bz,
    canZoomIn: zoom < MAX_ZOOM,
    canZoomOut: zoom > MIN_ZOOM,
  }), [zoom, zoomIn, zoomOut, bz]);

  return <ZoomContext.Provider value={value}>{children}</ZoomContext.Provider>;
}

export function useZoom() {
  const ctx = useContext(ZoomContext);
  // Falls back to a no-op 1x zoom for any component rendered outside the
  // Sidecar's ZoomProvider (e.g. reused elsewhere) instead of throwing.
  if (!ctx) return { zoom: 1, zoomIn: () => {}, zoomOut: () => {}, bz: (px) => px, canZoomIn: true, canZoomOut: false };
  return ctx;
}
