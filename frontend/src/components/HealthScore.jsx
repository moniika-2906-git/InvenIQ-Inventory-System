function HealthScore({ summary, theme }) {
  if (!summary) return null;

  const score = Math.round(
    ((summary.total_items - summary.low_stock_count) / summary.total_items) * 100
  );

  const getStatus = (s) => {
    if (s >= 85) return { label: "Excellent", color: "#10B981", bg: "#10B98115" };
    if (s >= 70) return { label: "Warning", color: "#F59E0B", bg: "#F59E0B15" };
    return { label: "Critical", color: "#EF4444", bg: "#EF444415" };
  };

  const status = getStatus(score);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (score / 100) * circumference;

  return (
    <div style={{
      background: theme.cardBg, borderRadius: "16px",
      padding: "24px", marginBottom: "20px",
      border: `1px solid ${theme.border}`,
      display: "flex", alignItems: "center",
      gap: "32px", flexWrap: "wrap"
    }}>
      {/* Circle */}
      <div style={{ position: "relative", width: "140px", height: "140px", flexShrink: 0 }}>
        <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="70" cy="70" r={radius}
            fill="none" stroke={theme.border} strokeWidth="10" />
          <circle cx="70" cy="70" r={radius}
            fill="none" stroke={status.color} strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)", textAlign: "center"
        }}>
          <div style={{
            fontSize: "1.8rem", fontWeight: "800", color: status.color, lineHeight: 1
          }}>
            {score}%
          </div>
          <div style={{ fontSize: "0.7rem", color: theme.subText, marginTop: "2px" }}>
            Health
          </div>
        </div>
      </div>

      {/* Details */}
      <div style={{ flex: 1, minWidth: "200px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <h3 style={{ margin: 0, color: theme.text, fontSize: "1.1rem", fontWeight: "700" }}>
            Inventory Health Score
          </h3>
          <span style={{
            background: status.bg, color: status.color,
            padding: "2px 10px", borderRadius: "20px",
            fontSize: "0.78rem", fontWeight: "600",
            border: `1px solid ${status.color}30`
          }}>
            {status.label}
          </span>
        </div>

        <p style={{ color: theme.subText, fontSize: "0.85rem", marginBottom: "16px" }}>
          Based on stock levels vs minimum thresholds across all materials
        </p>

        {/* Stats Row */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {[
            { label: "OK Items", value: summary.total_items - summary.low_stock_count, color: "#10B981" },
            { label: "Low Stock", value: summary.low_stock_count, color: "#EF4444" },
            { label: "Total", value: summary.total_items, color: "#6366F1" },
          ].map((stat, i) => (
            <div key={i} style={{
              background: stat.color + "10",
              borderRadius: "10px", padding: "10px 16px",
              border: `1px solid ${stat.color}20`
            }}>
              <div style={{
                fontSize: "1.3rem", fontWeight: "800", color: stat.color
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "0.75rem", color: theme.subText }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: "16px" }}>
          <div style={{
            background: theme.border, borderRadius: "10px",
            height: "8px", overflow: "hidden"
          }}>
            <div style={{
              background: `linear-gradient(90deg, ${status.color}, ${status.color}99)`,
              height: "8px", width: `${score}%`,
              borderRadius: "10px",
              transition: "width 1s ease"
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default HealthScore;