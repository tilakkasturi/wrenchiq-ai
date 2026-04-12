import { useState } from "react";
import { Activity, TrendingUp, AlertCircle, Zap, X, ChevronDown, ChevronUp } from "lucide-react";
import { useRecommendations } from "../context/RecommendationsContext";

const DOMAIN_ICONS = {
  utilization:   Activity,
  revenue:       TrendingUp,
  customer_risk: AlertCircle,
  anomaly:       Zap,
};

const PRIORITY_COLORS = {
  high:   "#FF6B35",
  medium: "#F59E0B",
  low:    "#6B7280",
};

export default function RecommendationCard({ recommendation, persona }) {
  const [expanded, setExpanded] = useState(false);
  const ctx = useRecommendations();

  if (!ctx) return null;
  const { dismissRecommendation } = ctx;

  const DomainIcon = DOMAIN_ICONS[recommendation.domain] || Zap;
  const priorityColor = PRIORITY_COLORS[recommendation.priority] || PRIORITY_COLORS.low;

  const personaData = recommendation.personas?.[persona];
  const headline = personaData?.headline || recommendation.headline || "Recommendation";
  const explanation = personaData?.explanation || recommendation.explanation || "";
  const metrics = recommendation.metrics || {};

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #E5E7EB",
      borderLeft: `3px solid ${recommendation.priority === "high" ? "#FF6B35" : "#E5E7EB"}`,
      borderRadius: 8,
      marginBottom: 6,
      overflow: "hidden",
    }}>
      {/* Header row */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          padding: "9px 10px",
          cursor: "pointer",
        }}
      >
        {/* Domain icon */}
        <div style={{
          width: 26,
          height: 26,
          borderRadius: 6,
          background: `${priorityColor}14`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 1,
        }}>
          <DomainIcon size={13} color={priorityColor} />
        </div>

        {/* Headline + priority badge */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "#111827", lineHeight: 1.4, marginBottom: 3 }}>
            {headline}
          </div>
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 0.4,
            color: priorityColor,
            background: `${priorityColor}14`,
            borderRadius: 3,
            padding: "1px 5px",
          }}>
            {recommendation.priority}
          </span>
        </div>

        {/* Expand/collapse + dismiss */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          {expanded ? <ChevronUp size={12} color="#9CA3AF" /> : <ChevronDown size={12} color="#9CA3AF" />}
          <button
            onClick={(e) => { e.stopPropagation(); dismissRecommendation(recommendation.id); }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 2,
              display: "flex",
              alignItems: "center",
              color: "#9CA3AF",
            }}
            title="Dismiss"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: "0 10px 10px 10px", borderTop: "1px solid #F3F4F6" }}>
          {explanation && (
            <p style={{ fontSize: 11, color: "#4B5563", lineHeight: 1.5, margin: "8px 0" }}>
              {explanation}
            </p>
          )}
          {/* Metric chips */}
          {Object.keys(metrics).length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
              {Object.entries(metrics).map(([key, val]) => (
                <span
                  key={key}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#374151",
                    background: "#F3F4F6",
                    borderRadius: 4,
                    padding: "2px 7px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {key}: {String(val)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
