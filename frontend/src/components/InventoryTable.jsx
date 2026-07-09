import { useState } from "react";

function InventoryTable({ data, theme }) {
  const [search, setSearch] = useState("");
  const [filterLow, setFilterLow] = useState(false);
  const [category, setCategory] = useState("All");
  const [plant, setPlant] = useState("All");

  if (!data) return <p>Loading...</p>;

  const categories = ["All", ...new Set(data.map(i => i.Category))];
  const plants = ["All", ...new Set(data.map(i => i.Plant))];

  const filtered = data.filter(item => {
    const matchSearch = item.Description.toLowerCase().includes(search.toLowerCase()) ||
      item.Material_ID.toLowerCase().includes(search.toLowerCase());
    const matchLow = filterLow ? item.Low_Stock === true : true;
    const matchCat = category === "All" ? true : item.Category === category;
    const matchPlant = plant === "All" ? true : item.Plant === plant;
    return matchSearch && matchLow && matchCat && matchPlant;
  });

  const inputStyle = {
    padding: "8px 14px", borderRadius: "8px",
    border: `1px solid ${theme.inputBorder}`,
    background: theme.inputBg, color: theme.text,
    fontSize: "0.9rem"
  };

  return (
    <div style={{
      background: theme.cardBg, borderRadius: "12px",
      padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      transition: "all 0.3s"
    }}>
      <h3 style={{ marginTop: 0, color: theme.text }}>
        📋 Inventory Items ({filtered.length})
      </h3>

      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <input
          placeholder="🔍 Search material..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: "180px" }}
        />
        <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={plant} onChange={e => setPlant(e.target.value)} style={inputStyle}>
          {plants.map(p => <option key={p}>{p}</option>)}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: theme.text }}>
          <input type="checkbox" checked={filterLow} onChange={e => setFilterLow(e.target.checked)} />
          ⚠️ Low Stock Only
        </label>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ background: theme.border }}>
              {["Material ID", "Description", "Category", "Stock Qty", "Min Level", "Unit", "Plant", "Status"].map(h => (
                <th key={h} style={{
                  padding: "10px 14px", textAlign: "left",
                  borderBottom: `2px solid ${theme.border}`,
                  color: theme.text
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, i) => (
              <tr key={i} style={{
                borderBottom: `1px solid ${theme.border}`,
              background: item.Low_Stock ? "#997e7e" : theme.cardBg
              }}>
                <td style={{ padding: "10px 14px", color: theme.text }}>{item.Material_ID}</td>
                <td style={{ padding: "10px 14px", color: theme.text }}>{item.Description}</td>
                <td style={{ padding: "10px 14px", color: theme.text }}>{item.Category}</td>
                <td style={{ padding: "10px 14px", fontWeight: "bold", color: theme.text }}>{item.Stock_Qty}</td>
                <td style={{ padding: "10px 14px", color: theme.text }}>{item.Min_Stock_Level}</td>
                <td style={{ padding: "10px 14px", color: theme.text }}>{item.Unit}</td>
                <td style={{ padding: "10px 14px", color: theme.text }}>{item.Plant}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{
                    background: item.Low_Stock ? "#e63946" : "#2a9d8f",
                    color: "white", padding: "3px 10px",
                    borderRadius: "20px", fontSize: "0.8rem"
                  }}>
                    {item.Low_Stock ? "⚠️ Low" : "✅ OK"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InventoryTable;