import { useState, useEffect, useCallback } from "react";
import { useDemo } from "./context/DemoContext";
import { SelectedCustomerProvider } from "./context/SelectedCustomerContext";
import { BrandingProvider } from "./context/BrandingContext";
import { ZoomProvider } from "./context/ZoomContext";
import { getWindowMode, setWindowMode } from "./services/externalLink";
import WrenchIQSidecarScreen from "./screens/WrenchIQSidecarScreen";
import WrenchIQSidecarFullScreen from "./screens/sidecar/WrenchIQSidecarFullScreen";

// Bridge: reads shopId from DemoContext to pass into SelectedCustomerProvider,
// same pattern as main.jsx's AppWithObjectives. Also owns which window mode
// is showing — "sidecar" (narrow docked panel, default) or "full"
// (full-screen queue + intelligence + chat) — and the header toggle that
// switches between them live. See src-tauri/src/lib.rs for the native window
// geometry each mode actually applies.
export default function WrenchIQSidecarApp() {
  const { activeShopId } = useDemo();
  const [windowMode, setLocalWindowMode] = useState("sidecar");

  useEffect(() => {
    getWindowMode().then(setLocalWindowMode);
  }, []);

  const onToggleWindowMode = useCallback(() => {
    const next = windowMode === "full" ? "sidecar" : "full";
    setWindowMode(next);
    setLocalWindowMode(next);
  }, [windowMode]);

  return (
    <SelectedCustomerProvider shopId={activeShopId || "cornerstone"} edition="am">
      <BrandingProvider>
        <ZoomProvider>
          {windowMode === "full"
            ? <WrenchIQSidecarFullScreen onToggleWindowMode={onToggleWindowMode} />
            : <WrenchIQSidecarScreen windowMode={windowMode} onToggleWindowMode={onToggleWindowMode} />}
        </ZoomProvider>
      </BrandingProvider>
    </SelectedCustomerProvider>
  );
}
