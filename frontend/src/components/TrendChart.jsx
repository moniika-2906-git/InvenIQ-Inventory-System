import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
  CartesianGrid, Area, AreaChart
} from "recharts";

function TrendChart({ data, theme }) {
  if (!data) return null;

  const combined = [
    ...data.historical.map(d => ({
      month: d.month, historical: d.stock, predicted: null
    })),
    ...data.predicted.map(d => ({
      month: d.month, historical: null, predicted: d.stock
    }))
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: theme.cardBg,
          border: `1px solid ${theme.border}`,
          borderRadius: "10px", padding: "10px 14px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)"
        }}>
          <p style={{ color: theme.subText, fontSize: "0.78rem", margin: "0 0 6px" }}>
            {label}
          </p>
          {payload.map((p, i) => (
            <p key={i} style={{
              color: p.color, fontWeight: "700",
              fontSize: "0.9rem", margin: "2px 0"
            }}>
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{
      background: theme.cardBg, borderRadius: "16px",
      padding: "24px", marginBottom: "20px",
      border: `1px solid ${theme.border}`
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px"
      }}>
        <div>
          <h3 style={{ margin: 0, color: theme.text, fontSize: "0.95rem", fontWeight: "700" }}>
            Stock Trend & ML Forecast
          </h3>
          <p style={{ margin: "4px 0 0", color: theme.subText, fontSize: "0.8rem" }}>
            Historical data with 6-month ML prediction
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { color: "#6366F1", label: "Historical" },
            { color: "#06B6D4", label: "ML Predicted", dashed: true },
          ].map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "4px 10px", borderRadius: "6px",
              background: item.color + "15",
              border: `1px solid ${item.color}30`
            }}>
              <div style={{
                width: "16px", height: "2px",
                background: item.dashed
                  ? `repeating-linear-gradient(90deg, ${item.color} 0, ${item.color} 4px, transparent 4px, transparent 8px)`
                  : item.color,
                borderRadius: "2px"
              }} />
              <span style={{ fontSize: "0.78rem", color: item.color, fontWeight: "600" }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={combined} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.border} vertical={false} />
          <XAxis
            dataKey="month" tick={{ fill: theme.subText, fontSize: 11 }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fill: theme.subText, fontSize: 11 }}
            axisLine={false} tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            x="M12" stroke={theme.subText}
            strokeDasharray="4 4"
            label={{ value: "Now", fill: theme.subText, fontSize: 11 }}
          />
          <Line
            type="monotone" dataKey="historical"
            stroke="#6366F1" strokeWidth={2.5}
            dot={{ fill: "#6366F1", r: 3, strokeWidth: 0 }}
            name="Historical" connectNulls={false}
            activeDot={{ r: 5, fill: "#6366F1" }}
          />
          <Line
            type="monotone" dataKey="predicted"
            stroke="#06B6D4" strokeWidth={2.5}
            strokeDasharray="6 3"
            dot={{ fill: "#06B6D4", r: 3, strokeWidth: 0 }}
            name="ML Predicted" connectNulls={false}
            activeDot={{ r: 5, fill: "#06B6D4" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TrendChart;