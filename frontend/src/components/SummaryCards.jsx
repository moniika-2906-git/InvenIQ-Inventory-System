// function SummaryCards({ summary, theme }) {
//   if (!summary) return <p>Loading...</p>;

//   const formatCurrency = (val) =>
//     new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

//   const cards = [
//     { label: "Total Items", value: summary.total_items, bg: "#4361ee", icon: "📦" },
//     { label: "Low Stock Alerts", value: summary.low_stock_count, bg: "#e63946", icon: "⚠️" },
//     { label: "Total Stock Value", value: formatCurrency(summary.total_stock_value), bg: "#2a9d8f", icon: "💰" },
//   ];

//   return (
//     <div style={{ display: "flex", gap: "20px", marginBottom: "24px", flexWrap: "wrap" }}>
//       {cards.map((card, i) => (
//         <div key={i} style={{
//           background: card.bg, color: "white",
//           borderRadius: "12px", padding: "24px 28px",
//           flex: "1", minWidth: "200px",
//           boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
//           transition: "transform 0.2s",
//           cursor: "default"
//         }}
//           onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
//           onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
//         >
//           <div style={{ fontSize: "2rem" }}>{card.icon}</div>
//           <div style={{ fontSize: "1.8rem", fontWeight: "bold", margin: "8px 0" }}>{card.value}</div>
//           <div style={{ opacity: 0.85, fontSize: "0.9rem" }}>{card.label}</div>
//         </div>
//       ))}
//     </div>
//   );
// }

// export default SummaryCards;
function SummaryCards({ summary, theme }) {
  if (!summary) return (
    <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
      {[1,2,3].map(i => (
        <div key={i} style={{
          flex: 1, height: "120px", borderRadius: "16px",
          background: theme.cardBg, border: `1px solid ${theme.border}`,
          animation: "pulse 2s infinite"
        }} />
      ))}
    </div>
  );

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0,
      notation: val > 9999999 ? "compact" : "standard"
    }).format(val);

  const cards = [
    {
      label: "Total Materials",
      value: summary.total_items,
      sub: "Across all plants",
      gradient: "linear-gradient(135deg, #6366F1, #8B5CF6)",
      icon: "◈",
      light: "#6366F115"
    },
    {
      label: "Low Stock Alerts",
      value: summary.low_stock_count,
      sub: "Need immediate attention",
      gradient: "linear-gradient(135deg, #EF4444, #F97316)",
      icon: "⚠",
      light: "#EF444415",
      urgent: summary.low_stock_count > 0
    },
    {
      label: "Inventory Value",
      value: formatCurrency(summary.total_stock_value),
      sub: "Total stock worth",
      gradient: "linear-gradient(135deg, #10B981, #06B6D4)",
      icon: "₹",
      light: "#10B98115"
    },
    {
      label: "Health Score",
      value: `${Math.round(((summary.total_items - summary.low_stock_count) / summary.total_items) * 100)}%`,
      sub: "Inventory health",
      gradient: "linear-gradient(135deg, #F59E0B, #EF4444)",
      icon: "♥",
      light: "#F59E0B15"
    },
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "16px", marginBottom: "24px"
    }}>
      {cards.map((card, i) => (
        <div
          key={i}
          className="fade-in"
          style={{
            background: theme.cardBg,
            borderRadius: "16px",
            padding: "20px",
            border: `1px solid ${card.urgent ? "#EF444440" : theme.border}`,
            position: "relative", overflow: "hidden",
            cursor: "default",
            transition: "transform 0.2s, box-shadow 0.2s",
            animationDelay: `${i * 0.1}s`
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {/* Background Gradient Blob */}
          <div style={{
            position: "absolute", top: "-20px", right: "-20px",
            width: "80px", height: "80px", borderRadius: "50%",
            background: card.light, filter: "blur(20px)"
          }} />

          {/* Icon */}
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "40px", height: "40px", borderRadius: "10px",
            background: card.gradient,
            fontSize: "1.1rem", color: "white", marginBottom: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
          }}>
            {card.icon}
          </div>

          {/* Value */}
          <div style={{
            fontSize: "1.8rem", fontWeight: "800",
            color: theme.text, lineHeight: 1.1,
            marginBottom: "4px"
          }}>
            {card.value}
          </div>

          {/* Label */}
          <div style={{
            fontSize: "0.85rem", fontWeight: "600",
            color: theme.text, marginBottom: "2px"
          }}>
            {card.label}
          </div>

          {/* Sub */}
          <div style={{ fontSize: "0.75rem", color: theme.subText }}>
            {card.sub}
          </div>

          {/* Urgent indicator */}
          {card.urgent && (
            <div style={{
              position: "absolute", top: "16px", right: "16px",
              width: "8px", height: "8px", borderRadius: "50%",
              background: "#EF4444",
              boxShadow: "0 0 0 3px #EF444430",
              animation: "pulse 2s infinite"
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default SummaryCards;