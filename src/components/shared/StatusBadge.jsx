const styles = {
  scheduled:     { bg: "#EFF6FF", text: "#2563EB", label: "Scheduled" },
  checked_in:    { bg: "#F0FDF4", text: "#16A34A", label: "Checked In" },
  inspection:    { bg: "#FFF7ED", text: "#EA580C", label: "Inspecting" },
  estimate_sent: { bg: "#FEF3C7", text: "#D97706", label: "Estimate Sent" },
  approved:      { bg: "#ECFDF5", text: "#059669", label: "Approved" },
  in_progress:   { bg: "#EDE9FE", text: "#7C3AED", label: "In Progress" },
  qc:            { bg: "#FFF1F2", text: "#E11D48", label: "QC Review" },
  ready:         { bg: "#F0FDFA", text: "#0D9488", label: "Ready" },
};

export default function StatusBadge({ status }) {
  const s = styles[status] || styles.scheduled;
  return (
    <span style={{
      background: s.bg, color: s.text,
      padding: "2px 10px", borderRadius: 12,
      fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}
