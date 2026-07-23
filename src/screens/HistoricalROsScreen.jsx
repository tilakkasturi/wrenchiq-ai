import { useState } from "react";
import { Sparkles, FileClock, ShieldCheck } from "lucide-react";
import { COLORS } from "../theme/colors";
import { openExternalUrl } from "../services/externalLink";
import { useDemo } from "../context/DemoContext";

const RO_NER_DEMO_URL = "http://localhost:8090/?ds=cornerstone&tab=live";

// Made-up historical volume for a single-location, 4-bay shop — illustrates
// how much RO history WrenchIQ has available to learn from.
const RO_HISTORY_BY_YEAR = [
  { year: 2025, count: 1540 },
  { year: 2024, count: 1480 },
  { year: 2023, count: 1410 },
];

const WINDOW_OPTIONS = [
  { years: 1, label: "1 Year" },
  { years: 2, label: "2 Years" },
  { years: 3, label: "3 Years" },
];

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: 14, color: COLORS.textSecondary, margin: "4px 0 0" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function PrediiLearnConsentModal({ shopName, onAccept, onCancel }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(15,23,32,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 14, maxWidth: 460, width: "100%",
          padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8, background: COLORS.borderLight,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <ShieldCheck size={17} color={COLORS.primary} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>
            Predii Data Access Disclaimer
          </div>
        </div>

        <p style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.6, margin: "0 0 20px" }}>
          You acknowledge Predii is accessing <strong>{shopName}'s</strong> historical repair orders
          for the purpose of setting up the WrenchIQ Intelligence application. Predii will not share
          any of these learnings externally, and your learnings are isolated and secure.
          Please provide acceptance by clicking Accept below, or Cancel to cancel out of this and not proceed.
        </p>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              background: "#fff", color: COLORS.textSecondary,
              border: `1px solid ${COLORS.border}`, borderRadius: 8,
              padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onAccept}
            style={{
              background: COLORS.accent, color: "#fff", border: "none",
              borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HistoricalROsScreen() {
  const { shopName } = useDemo();
  const [years, setYears] = useState(1);
  const [showConsent, setShowConsent] = useState(false);

  const selectedYears = RO_HISTORY_BY_YEAR.slice(0, years);
  const totalCount = selectedYears.reduce((sum, y) => sum + y.count, 0);
  const maxCount = Math.max(...RO_HISTORY_BY_YEAR.map((y) => y.count));

  const cardStyle = {
    background: "#fff",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  };

  return (
    <div>
      <SectionHeader
        title="Historical ROs"
        subtitle="Process past repair orders so WrenchIQ can learn your shop's patterns — parts usage, labor times, common upsells, and pricing."
      />

      {/* Processing window */}
      <div style={cardStyle}>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 4 }}>
          History to Process
        </div>
        <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 16 }}>
          Choose how far back WrenchIQ should look when building its recommendation model.
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {WINDOW_OPTIONS.map((opt) => {
            const selected = years === opt.years;
            return (
              <button
                key={opt.years}
                onClick={() => setYears(opt.years)}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1px solid ${selected ? COLORS.primary : COLORS.border}`,
                  background: selected ? COLORS.primary : "#fff",
                  color: selected ? "#fff" : COLORS.textSecondary,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* RO count by year */}
        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Repair Orders by Year
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {RO_HISTORY_BY_YEAR.map((row) => {
            const included = selectedYears.includes(row);
            return (
              <div key={row.year} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, fontSize: 13, fontWeight: 600, color: included ? COLORS.textPrimary : COLORS.textMuted }}>
                  {row.year}
                </div>
                <div style={{ flex: 1, background: COLORS.borderLight, borderRadius: 6, height: 20, position: "relative", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${(row.count / maxCount) * 100}%`,
                      height: "100%",
                      background: included ? COLORS.primary : COLORS.textMuted,
                      opacity: included ? 1 : 0.35,
                      borderRadius: 6,
                    }}
                  />
                </div>
                <div style={{ width: 70, textAlign: "right", fontSize: 13, fontWeight: 700, color: included ? COLORS.textPrimary : COLORS.textMuted }}>
                  {row.count.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            padding: "10px 14px",
          }}
        >
          <FileClock size={16} color={COLORS.textSecondary} />
          <div style={{ fontSize: 13, color: COLORS.textPrimary }}>
            <strong>{totalCount.toLocaleString()} ROs</strong> to process across {years} {years === 1 ? "year" : "years"}
          </div>
        </div>
      </div>

      {/* Predii Learn */}
      <div style={cardStyle}>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 4 }}>
          Predii Learn
        </div>
        <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 16 }}>
          Runs entity extraction and symptom/diagnosis matching over the selected history — launches the Predii Learn RO entity-extraction workspace.
        </div>
        <button
          onClick={() => setShowConsent(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: COLORS.accent,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 18px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Sparkles size={15} />
          Predii Learn
        </button>
      </div>

      {showConsent && (
        <PrediiLearnConsentModal
          shopName={(shopName || "Cornerstone Auto Group").split(" ")[0]}
          onCancel={() => setShowConsent(false)}
          onAccept={() => {
            setShowConsent(false);
            openExternalUrl(RO_NER_DEMO_URL);
          }}
        />
      )}
    </div>
  );
}
