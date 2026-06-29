const styles = {
  normal: { bg: "#ECFDF5", text: "#10B981", dot: "#10B981", label: "Normal Priority" },
  urgent: { bg: "#FFFBEB", text: "#F59E0B", dot: "#F59E0B", label: "Urgent Priority" },
  emergency: { bg: "#FEF2F2", text: "#EF4444", dot: "#EF4444", label: "Emergency Priority" },
};

export default function UrgencyBadge({ level = "normal" }) {
  const s = styles[level] || styles.normal;
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{
          backgroundColor: s.dot,
          boxShadow: `0 0 0 0 ${s.dot}55`,
          animation: "pulse-ring 1.6s ease-out infinite",
        }}
      />
      <span>{s.label}</span>
    </div>
  );
}

