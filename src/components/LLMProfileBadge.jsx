// LLMProfileBadge — "PrediiLLM" / "Microsoft/OpenAI" indicator, shared by the
// Sidecar (narrow + full window modes) and the AM/OEM admin top bar
// (PersonaShell.jsx). Ctrl+P (see src/hooks/useLLMProfileStatus.js) reveals
// the resolved model + endpoint next to it — a diagnostic toggle, off by
// default so the badge stays compact in demos.
import { COLORS } from "../theme/colors";

// `dark` matches this badge's colors to its parent surface: true (default)
// for the Sidecar's dark panels, false for the admin top bar's white one —
// same pill shapes, just swapped for contrast against the opposite background.
export function LLMProfileBadge({ llmProfile, llmStatus, showDetail, dark = true }) {
  if (!llmProfile) return null;
  const isAzure = llmProfile === "azure";
  const active = llmStatus?.profiles?.[llmProfile];
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
      <span
        title="Which LLM endpoint is currently active. Ctrl+P toggles model/endpoint detail."
        style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
          padding: "2px 6px", borderRadius: 5, flexShrink: 0,
          background: isAzure ? "rgba(56,189,248,0.15)" : "rgba(255,214,10,0.15)",
          color: isAzure ? "#7DD3FC" : dark ? COLORS.gold : "#B45309",
          border: `1px solid ${isAzure ? "rgba(56,189,248,0.35)" : "rgba(255,214,10,0.3)"}`,
        }}
      >
        {isAzure ? "Microsoft/OpenAI" : "PrediiLLM"}
      </span>
      {showDetail && active && (
        <span
          title={active.baseUrl || "—"}
          style={{
            fontSize: 9, fontFamily: "monospace",
            color: dark ? "rgba(255,255,255,0.55)" : COLORS.textMuted,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}
        >
          {active.model || "—"} · {active.baseUrl || "—"}
        </span>
      )}
    </span>
  );
}
