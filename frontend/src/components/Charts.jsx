import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  CartesianGrid
} from "recharts";

const COLORS = ["#6366F1", "#06B6D4", "#10B981", "#F59E0B"];

const CustomTooltip = ({ active, payload, theme }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: theme.cardBg,
        border: `1px solid ${theme.border}`,
        borderRadius: "10px", padding: "10px 14px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)"
      }}>
        <p style={{ color: theme.text, fontWeight: "600", margin: 0 }}>
          {payload[0].name}
        </p>
        <p style={{ color: payload[0].fill || "#6366F1", margin: "4px 0 0", fontWeight: "700" }}>
          {payload[0].value} items
        </p>
      </div>
    );
  }
  return null;
};

function Charts({ summary, theme }) {
  if (!summary) return null;

  const pieData = Object.entries(summary.categories).map(([name, value]) => ({
    name, value
  }));

  const barData = Object.entries(summary.plants).map(([name, value]) => ({
    plant: name, items: value
  }));

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "16px", marginBottom: "20px"
    }}>

      {/* Pie Chart */}
      <div style={{
        background: theme.cardBg, borderRadius: "16px",
        padding: "24px", border: `1px solid ${theme.border}`,
        transition: "all 0.3s"
      }}>
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ margin: 0, color: theme.text, fontSize: "0.95rem", fontWeight: "700" }}>
            Category Distribution
          </h3>
          <p style={{ margin: "4px 0 0", color: theme.subText, fontSize: "0.8rem" }}>
            Inventory breakdown by category
          </p>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%" cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip theme={theme} />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          {pieData.map((entry, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{
                  width: "10px", height: "10px", borderRadius: "50%",
                  background: COLORS[i % COLORS.length], flexShrink: 0
                }} />
                <span style={{ fontSize: "0.82rem", color: theme.subText }}>
                  {entry.name}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: "600", color: theme.text }}>
                  {entry.value}
                </span>
                <span style={{
                  fontSize: "0.75rem", color: COLORS[i % COLORS.length],
                  background: COLORS[i % COLORS.length] + "15",
                  padding: "1px 6px", borderRadius: "4px"
                }}>
                  {Math.round((entry.value / summary.total_items) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bar Chart */}
      <div style={{
        background: theme.cardBg, borderRadius: "16px",
        padding: "24px", border: `1px solid ${theme.border}`,
        transition: "all 0.3s"
      }}>
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ margin: 0, color: theme.text, fontSize: "0.95rem", fontWeight: "700" }}>
            Plant Distribution
          </h3>
          <p style={{ margin: "4px 0 0", color: theme.subText, fontSize: "0.8rem" }}>
            Items across all plants
          </p>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} barSize={40}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme.border}
              vertical={false}
            />
            <XAxis
              dataKey="plant"
              tick={{ fill: theme.subText, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: theme.subText, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip theme={theme} />} />
            <Bar dataKey="items" radius={[8, 8, 0, 0]} name="Items">
              {barData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Plant Stats */}
        <div style={{
          display: "flex", gap: "8px",
          marginTop: "12px", flexWrap: "wrap"
        }}>
          {barData.map((item, i) => (
            <div key={i} style={{
              flex: 1, minWidth: "80px",
              background: COLORS[i % COLORS.length] + "15",
              borderRadius: "10px", padding: "10px",
              textAlign: "center",
              border: `1px solid ${COLORS[i % COLORS.length]}30`
            }}>
              <div style={{
                fontSize: "1.2rem", fontWeight: "800",
                color: COLORS[i % COLORS.length]
              }}>
                {item.items}
              </div>
              <div style={{ fontSize: "0.75rem", color: theme.subText, marginTop: "2px" }}>
                {item.plant}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Charts;