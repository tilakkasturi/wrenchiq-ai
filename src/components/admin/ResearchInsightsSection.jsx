// ResearchInsightsSection — S8: surfaces the industry research findings that
// underlie the S7 "Shop Owner Priorities" spec work as a standalone,
// read-only admin/settings section, with best-practice notes attached to
// each finding. Static reference content for this pass (no live data fetch).
//
// Source research: WrenchIQ Research — Shop Owner Priorities: Operations &
// Profitability (Confluence: prediiv2/pages/4166156292).

import {
  AlertTriangle, TrendingUp, Building2, Sparkles, ExternalLink,
} from "lucide-react";
import { COLORS } from "../../theme/colors";

const SOURCE_URL =
  "https://predii.atlassian.net/wiki/spaces/prediiv2/pages/4166156292";

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

function Card({ icon: Icon, title, children }) {
  return (
    <div
      style={{
        background: COLORS.bgCard,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: COLORS.borderLight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={16} color={COLORS.primary} />
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

// ── Finding row: a pain point + the best-practice note attached to it ──
function Finding({ title, body, note }) {
  return (
    <div
      style={{
        padding: "14px 0",
        borderBottom: `1px solid ${COLORS.borderLight}`,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.55, marginBottom: 8 }}>
        {body}
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "flex-start",
          background: "#FFF7ED",
          border: "1px solid #FDE4CC",
          borderRadius: 8,
          padding: "8px 10px",
        }}
      >
        <Sparkles size={13} color={COLORS.accent} style={{ flexShrink: 0, marginTop: 2 }} />
        <span style={{ fontSize: 12, color: "#9A4A1E", lineHeight: 1.5 }}>
          <strong>Best practice: </strong>{note}
        </span>
      </div>
    </div>
  );
}

const PAIN_POINTS = [
  {
    title: "Technician shortage (#1 issue — 59% of owners)",
    body: "Nearly six in ten shop owners cite the tech shortage as their top operational challenge, constraining throughput and growth more than any other factor.",
    note: "Prioritize retention (efficiency-based pay, career pathing) over pure recruiting spend, and use scheduling/AI tools to get more throughput per available tech.",
  },
  {
    title: "Vehicle technology complexity (ADAS/EV)",
    body: "Independents are losing complex ADAS and EV work to dealerships because they lack calibration equipment, training, or OEM data access.",
    note: "Invest selectively in ADAS calibration capability and EV-certified training for at least one tech; partner/sublet the rest rather than turning away the customer relationship.",
  },
  {
    title: "Rising parts costs and tariffs",
    body: "Parts cost inflation and tariff exposure are compressing parts margins and creating estimate-accuracy risk.",
    note: "Re-quote parts closer to the repair date, build tariff-aware buffers into estimates, and diversify vendor sourcing (see Parts Intelligence).",
  },
  {
    title: "Comebacks & quality control",
    body: "Industry first-time-fix rate runs 75–80%; best-in-class shops hit 85%+, directly reducing comebacks and warranty cost.",
    note: "Standardize road-test and torque/verification checklists before RO closeout; track comebacks by technician to target coaching.",
  },
  {
    title: "DVI follow-through",
    body: "Shops without a disciplined Digital Vehicle Inspection process see only 20–25% customer approval on $1,000+ repair recommendations — disciplined shops see 55–65%.",
    note: "Require photo/video evidence on every DVI line over a dollar threshold and present it to the customer before, not after, the estimate call.",
  },
  {
    title: "Customer communication breakdowns",
    body: "About 45% of defecting customers cite unexpected costs or poor communication as their reason for leaving — not price.",
    note: "Proactively text status/cost updates at each RO stage gate; never let a price change reach the customer as a surprise at pickup.",
  },
];

const KPI_ROWS = [
  { metric: "Technician efficiency", avg: "75–85%", best: ">85%" },
  { metric: "First-time-fix rate", avg: "75–80%", best: "85%+" },
  { metric: "DVI approval on $1,000+ repairs", avg: "20–25%", best: "55–65%" },
  { metric: "Net profit margin", avg: "~6.3–9.6%", best: "10–20%" },
  { metric: "Gross margin — labor", avg: "50–65%", best: "60–70%" },
  { metric: "Gross margin — parts", avg: "20–30%", best: "25–30%+" },
  { metric: "ELR vs. posted-rate gap", avg: ">10–15% = leakage", best: "<10%" },
  { metric: "National posted labor rate", avg: "$120–159/hr", best: "—" },
];

export default function ResearchInsightsSection() {
  return (
    <div>
      <SectionHeader
        title="Research & Best Practices"
        subtitle="Industry research underlying the Shop Owner Priorities spec (S7) — operational pain points and the best-practice notes derived from them."
      />

      <Card icon={AlertTriangle} title="Operational Pain Points">
        {PAIN_POINTS.map((f) => (
          <Finding key={f.title} {...f} />
        ))}
      </Card>

      <Card icon={TrendingUp} title="Profitability KPIs — industry average vs. best-in-class">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Metric", "Industry avg.", "Best-in-class"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: COLORS.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {KPI_ROWS.map((row, i) => (
                <tr key={row.metric}>
                  <td
                    style={{
                      padding: "9px 10px",
                      color: COLORS.textPrimary,
                      fontWeight: 600,
                      borderBottom: i < KPI_ROWS.length - 1 ? `1px solid ${COLORS.borderLight}` : "none",
                    }}
                  >
                    {row.metric}
                  </td>
                  <td
                    style={{
                      padding: "9px 10px",
                      color: COLORS.textSecondary,
                      borderBottom: i < KPI_ROWS.length - 1 ? `1px solid ${COLORS.borderLight}` : "none",
                    }}
                  >
                    {row.avg}
                  </td>
                  <td
                    style={{
                      padding: "9px 10px",
                      color: COLORS.success,
                      fontWeight: 700,
                      borderBottom: i < KPI_ROWS.length - 1 ? `1px solid ${COLORS.borderLight}` : "none",
                    }}
                  >
                    {row.best}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 12, lineHeight: 1.5 }}>
          <strong style={{ color: COLORS.textSecondary }}>Best practice: </strong>
          Track ELR-vs-posted-rate gap monthly — a gap over 10–15% is the single clearest signal of
          labor-rate leakage and usually the fastest profitability fix available to an owner.
        </div>
      </Card>

      <Card icon={Building2} title="Competitive Positioning vs. Dealerships">
        <Finding
          title="Dealer share of service visits is shrinking"
          body="Dealer share of service visits fell from 33% to 29% (2018–2025) while independent shops rose from 25% to 27% (Cox Automotive)."
          note="Lean into the trend in marketing — independents are winning share, not just holding on."
        />
        <div style={{ padding: "14px 0" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 4 }}>
            Price is not the reason customers defect
          </div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.55, marginBottom: 8 }}>
            Dealer average repair cost ($261) is now lower than independents' ($275). Customers who
            leave cite trust, communication, and convenience — not price.
          </div>
          <div
            style={{
              display: "flex", gap: 8, alignItems: "flex-start",
              background: "#FFF7ED", border: "1px solid #FDE4CC", borderRadius: 8, padding: "8px 10px",
            }}
          >
            <Sparkles size={13} color={COLORS.accent} style={{ flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 12, color: "#9A4A1E", lineHeight: 1.5 }}>
              <strong>Best practice: </strong>Compete on transparency and communication cadence, not
              on discounting — a lower price does not defend against the trust gap dealers are closing.
            </span>
          </div>
        </div>
      </Card>

      <Card icon={Sparkles} title="2025–2026 Trends">
        <Finding
          title="AI diagnostics adoption is accelerating"
          body="AI-assisted diagnostics adoption is projected to grow from ~25% of shops in 2025 to 60%+ in 2026."
          note="Get ahead of the curve now — early adopters compound the technician-shortage benefit before it becomes table stakes."
        />
        <Finding
          title="Photo/video DVI is near table-stakes"
          body="DVI with photo or video evidence now sees 80%+ customer open rates and is quickly becoming the expected baseline, not a differentiator."
          note="If DVI photos/video aren't already mandatory shop-wide, treat this as the highest-leverage process fix available."
        />
        <Finding
          title="Right-to-repair / OEM data access anxiety"
          body="State and federal right-to-repair activity (Maine's law, the federal REPAIR Act) is creating uncertainty around independents' long-term access to OEM diagnostic and telematics data."
          note="Diversify data sources today (ALLDATA, aftermarket scan tools) rather than depending on a single OEM data channel."
        />
        <Finding
          title="EV/hybrid readiness gap"
          body="Most independents remain under-equipped and under-trained for EV/hybrid service relative to demand growth."
          note="Start with high-voltage safety certification for one technician per shop as the minimum viable entry point."
        />
        <Finding
          title="Software consolidation to unified platforms"
          body="Shops consolidating from multiple point tools onto a unified platform report efficiency gains of up to 30%."
          note="Audit tool sprawl (scheduling, DVI, communication, parts) — consolidation is often a bigger margin lever than any single feature upgrade."
        />
        <div style={{ padding: "14px 0 0" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 4 }}>
            Proactive communication as a trust-builder
          </div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.55, marginBottom: 8 }}>
            Text-based status updates and online scheduling are emerging as measurable trust and
            retention drivers, independent of price or turnaround time.
          </div>
          <div
            style={{
              display: "flex", gap: 8, alignItems: "flex-start",
              background: "#FFF7ED", border: "1px solid #FDE4CC", borderRadius: 8, padding: "8px 10px",
            }}
          >
            <Sparkles size={13} color={COLORS.accent} style={{ flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 12, color: "#9A4A1E", lineHeight: 1.5 }}>
              <strong>Best practice: </strong>Enable self-service online scheduling and default every
              RO stage change to trigger a customer text — treat both as retention infrastructure, not
              "nice to have" features.
            </span>
          </div>
        </div>
      </Card>

      <a
        href={SOURCE_URL}
        target="_blank"
        rel="noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: COLORS.textMuted,
          textDecoration: "none",
        }}
      >
        <ExternalLink size={12} />
        Source: WrenchIQ Research — Shop Owner Priorities: Operations &amp; Profitability
      </a>
    </div>
  );
}
