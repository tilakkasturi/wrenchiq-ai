import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, ArrowRight, Phone, DollarSign, Zap, Users, Wrench, Star } from "lucide-react";
import { COLORS } from "../theme/colors";

const pulse = {
  green: { bg: "#DCFCE7", text: "#15803D", dot: "#22C55E" },
  yellow: { bg: "#FEF9C3", text: "#A16207", dot: "#F59E0B" },
  red: { bg: "#FEE2E2", text: "#B91C1C", dot: "#EF4444" },
};

function HealthDot({ color }) {
  return (
    <div style={{
      width: 10, height: 10, borderRadius: "50%",
      background: pulse[color].dot, flexShrink: 0,
      boxShadow: `0 0 0 3px ${pulse[color].bg}`,
    }} />
  );
}

function InsightBullet({ color, children }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: "1px solid #F3F4F6" }}>
      <div style={{ paddingTop: 3 }}><HealthDot color={color} /></div>
      <div style={{ fontSize: 14, color: COLORS.textPrimary, lineHeight: 1.55 }}>{children}</div>
    </div>
  );
}

function ActionCard({ urgent, icon: Icon, title, subtitle, cta, ctaColor }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 12, border: `1px solid ${urgent ? "#FCA5A5" : "#E5E7EB"}`,
      padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: 14,
      borderLeft: `4px solid ${ctaColor || COLORS.accent}`,
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: urgent ? "#FEF2F2" : "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={18} color={ctaColor || COLORS.accent} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.5 }}>{subtitle}</div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: ctaColor || COLORS.accent, display: "flex", alignItems: "center", gap: 4, flexShrink: 0, paddingTop: 2 }}>
        {cta} <ArrowRight size={13} />
      </div>
    </div>
  );
}

function TechCard({ name, emoji, status, color, message, action }) {
  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E5E7EB", padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{emoji}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: pulse[color].text, background: pulse[color].bg, borderRadius: 4, padding: "1px 6px", display: "inline-block", marginTop: 2 }}>{status}</div>
        </div>
      </div>
      <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.5, marginBottom: action ? 8 : 0 }}>{message}</div>
      {action && (
        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.accent, display: "flex", alignItems: "center", gap: 4 }}>
          <ArrowRight size={12} /> {action}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsScreen() {
  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 4 }}>
          Here's how your shop is doing, Tilak 👋
        </div>
        <div style={{ fontSize: 14, color: COLORS.textSecondary }}>
          February 2026 · Based on your last 30 days of data
        </div>
      </div>

      {/* Overall Health Banner */}
      <div style={{ background: "linear-gradient(135deg, #0D3B45 0%, #1A5C6B 100%)", borderRadius: 14, padding: "20px 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>📈</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Your shop is performing well this month</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
            Revenue is up 8.2% from last month and you're averaging <strong style={{ color: "#fff" }}>$506 per repair order</strong> — above your $500 goal. Two things need your attention today.
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: "#fff" }}>$78.4K</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Month-to-date revenue</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

        {/* What's Happening */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "18px 20px" }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span>What's going on</span>
          </div>
          <InsightBullet color="green">
            <strong>Revenue is up $6,300 vs. last month.</strong> Your November brake promotion worked — brake jobs are 22% of your services now. Keep it going.
          </InsightBullet>
          <InsightBullet color="green">
            <strong>James K. is on fire.</strong> He's billing 96% of available hours and customers love him (4.8 stars). He should be doing your biggest jobs.
          </InsightBullet>
          <InsightBullet color="yellow">
            <strong>Mike R. slowed down this week</strong> — he's at 85% efficiency, down from his usual 90%+. Worth a quick check-in to see if something's going on.
          </InsightBullet>
          <InsightBullet color="yellow">
            <strong>December is your slowest month</strong> every year ($69.8K last year). It's 10 months away — start building your holiday service package now so you don't feel it.
          </InsightBullet>
          <InsightBullet color="red">
            <strong>You're missing brake revenue.</strong> Vehicles in your market average 28% brake jobs, you're at 22%. That's roughly <strong>$3,400/month left on the table</strong>.
          </InsightBullet>
        </div>

        {/* Do These Today */}
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <Zap size={16} color={COLORS.accent} />
            <span>Do these today</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            <ActionCard
              urgent
              icon={Phone}
              title="Call Sarah Johnson"
              subtitle="Her $1,847 estimate has been sitting for 2 hours with no response. Customers who get a personal call approve 3× more often than texts."
              cta="Call now"
              ctaColor="#EF4444"
            />
            <ActionCard
              icon={DollarSign}
              title="Check in on Maria Rodriguez's brakes"
              subtitle="Brake pads flagged at 3mm during oil change. That's a $340 upsell sitting in Bay 1 right now — James just needs the green light."
              cta="Approve upsell"
              ctaColor={COLORS.accent}
            />
            <ActionCard
              icon={Users}
              title="Assign Bay 2 to David Chen"
              subtitle="His CR-V has been in inspection for 45 mins with no bay assignment. Catalytic converter diagnosis — Mike needs to get started."
              cta="Assign now"
              ctaColor={COLORS.primary}
            />
          </div>

          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={16} color="#22C55E" />
            <span>This week, focus on</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <ActionCard
              icon={Wrench}
              title="Add a brake inspection to every oil change"
              subtitle="You're doing 6 oil changes today. If just 2 of those need pads, that's $680 in additional revenue with no extra marketing."
              cta="Tell your team"
              ctaColor="#22C55E"
            />
            <ActionCard
              icon={Star}
              title="Ask your 3 happiest customers for a Google review"
              subtitle="Maria R., James W., and Carlos T. all gave 5 stars last week. A text message now gets you a review while the visit is fresh."
              cta="Send texts"
              ctaColor="#7C3AED"
            />
          </div>
        </div>
      </div>

      {/* Your Team */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "18px 20px" }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <Users size={16} color={COLORS.primary} />
          <span>Your team — how they're doing</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <TechCard
            name="James K."
            emoji="⭐"
            status="Top performer"
            color="green"
            message="Billing 96% of his hours and averaging $545 per job. Customers are happy — 4.8 stars. Give him the BMW X3 AC job this afternoon, it's complex and he'll nail it."
            action="Assign BMW X3 to James"
          />
          <TechCard
            name="Mike R."
            emoji="🔧"
            status="Check in today"
            color="yellow"
            message="Dropped to 85% efficiency this week, usually runs 90%+. Nothing alarming yet, but worth a quick 5-minute conversation. Could just be a tough job streak."
            action="Have a quick chat"
          />
          <TechCard
            name="Carlos M."
            emoji="✅"
            status="Solid"
            color="green"
            message="Consistent at 92% efficiency with a 4.7-star rating. He's your go-to for Ford and Subaru jobs — customers keep asking for him by name."
          />
        </div>
      </div>

    </div>
  );
}
