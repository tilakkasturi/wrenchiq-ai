// useLLMProfileStatus — which LLM profile is actually powering "Predii LLM"
// right now (see Settings → Integrations → AI Engine /
// server/services/llmProviderConfig.js), plus the Ctrl+P (Cmd+P on macOS)
// diagnostic toggle that reveals its resolved model + endpoint next to the
// "PrediiLLM" badge (src/components/LLMProfileBadge.jsx). Shared by the
// Sidecar (useSidecarRO) and the AM/OEM admin top bar (PersonaShell.jsx) so
// both poll/listen the same way instead of drifting.
import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export function useLLMProfileStatus() {
  const [llmProfile, setLlmProfile] = useState(null);
  // Full { activeProfile, profiles: { default: {label,baseUrl,model,configured}, ... } }
  // — llmProfile above is just status.activeProfile, kept separately since
  // it's what most callers actually need.
  const [llmStatus, setLlmStatus] = useState(null);

  useEffect(() => {
    const fetchProfile = () => {
      fetch(`${API_BASE}/api/llm-provider-config`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => { if (data) { setLlmProfile(data.activeProfile); setLlmStatus(data); } })
        .catch(() => {});
    };
    fetchProfile();
    // Poll so a profile switch made in Settings while this UI is already
    // open (no restart, no reload) shows up here without a relaunch.
    const interval = setInterval(fetchProfile, 15000);
    return () => clearInterval(interval);
  }, []);

  // Off by default so the badge stays compact; prevents the browser/OS print
  // dialog, since that's what this chord would otherwise trigger.
  const [llmDetailVisible, setLlmDetailVisible] = useState(false);
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setLlmDetailVisible((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return { llmProfile, llmStatus, llmDetailVisible };
}
