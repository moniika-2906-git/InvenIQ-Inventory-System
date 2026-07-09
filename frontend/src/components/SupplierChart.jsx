import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell
} from "recharts";

const COLORS = ["#4361ee", "#2a9d8f", "#e63946", "#f4a261"];

function SupplierChart({ data, theme }) {
  if (!data) return null;

  // Supplier wise items count
  const supplierCount = {};
  const supplierLowStock = {};

  data.forEach(item => {
    supplierCount[item.Supplier] = (supplierCount[item.Supplier] || 0) + 1;
    if (item.Low_Stock) {
      supplierLowStock[item.Supplier] = (supplierLowStock[item.Supplier] || 0) + 1;
    }
  });

  const chartData = Object.entries(supplierCount).map(([supplier, count]) => ({
    supplier,
    total: count,
    low_stock: supplierLowStock[supplier] || 0,
    healthy: count - (supplierLowStock[supplier] || 0)
  }));

  return (
    <div style={{
      background: theme.cardBg, borderRadius: "12px",
      padding: "24px", marginBottom: "24px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      transition: "all 0.3s"
    }}>
      <h3 style={{ marginTop: 0, color: theme.text }}>
        🏭 Supplier Analysis
      </h3>
      <p style={{ color: theme.subText, fontSize: "0.9rem", marginTop: "-8px" }}>
        Supplier wise inventory — healthy vs low stock items
      </p>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
          <XAxis dataKey="supplier" tick={{ fill: theme.text, fontSize: 12 }} />
          <YAxis tick={{ fill: theme.text, fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              background: theme.cardBg,
              border: `1px solid ${theme.border}`,
              color: theme.text
            }}
          />
          <Bar dataKey="healthy" name="Healthy Stock" fill="#2a9d8f" radius={[4, 4, 0, 0]} stackId="a" />
          <Bar dataKey="low_stock" name="Low Stock" fill="#e63946" radius={[4, 4, 0, 0]} stackId="a" />
        </BarChart>
      </ResponsiveContainer>

      {/* Supplier Cards */}
      <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
        {chartData.map((s, i) => (
          <div key={i} style={{
            background: theme.bg, borderRadius: "10px",
            padding: "12px 16px", flex: "1", minWidth: "140px",
            border: `1px solid ${theme.border}`
          }}>
            <div style={{ fontWeight: "600", color: theme.text, fontSize: "0.9rem" }}>
              {s.supplier}
            </div>
            <div style={{ color: "#2a9d8f", fontSize: "0.85rem", marginTop: "4px" }}>
              ✅ {s.healthy} Healthy
            </div>
            <div style={{ color: "#e63946", fontSize: "0.85rem" }}>
              ⚠️ {s.low_stock} Low Stock
            </div>
            <div style={{ color: theme.subText, fontSize: "0.8rem", marginTop: "4px" }}>
              Total: {s.total} items
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SupplierChart;