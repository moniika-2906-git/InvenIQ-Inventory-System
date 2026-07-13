import { useState, useEffect } from "react";
import { api } from '../utils/api';

function AnomalyDetection({ theme }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/anomalies')
      .then(r => r?.json())
      .then(d => {
        if (d) { setData(d); setLoading(false); }
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{
      background: theme.cardBg, borderRadius: "12px",
      padding: "24px", marginBottom: "24px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
    }}>
      <p style={{ color: theme.text }}>🔍 Anomalies detect ho rahi hain...</p>
    </div>
  );

  return (
    <div style={{
      background: theme.cardBg, borderRadius: "12px",
      padding: "24px", marginBottom: "24px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      transition: "all 0.3s"
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h3 style={{ margin: 0, color: theme.text }}>
            🔍 AI Anomaly Detection
          </h3>
          <p style={{ margin: "4px 0 0", color: theme.subText, fontSize: "0.85rem" }}>
            Statistical analysis using Z-Score method
          </p>
        </div>
        <span style={{
          background: data.total_anomalies > 0 ? "#fff5f5" : "#f0fdf4",
          color: data.total_anomalies > 0 ? "#e63946" : "#2a9d8f",
          padding: "6px 16px", borderRadius: "20px",
          fontWeight: "600", fontSize: "0.9rem",
          border: `1px solid ${data.total_anomalies > 0 ? "#ffcccc" : "#bbf7d0"}`
        }}>
          {data.total_anomalies > 0
            ? `🚨 ${data.total_anomalies} Anomalies Found`
            : "✅ No Anomalies"}
        </span>
      </div>

      {/* Anomaly Cards */}
      {data.total_anomalies === 0 ? (
        <div style={{
          textAlign: "center", padding: "40px",
          color: theme.subText, fontSize: "1rem"
        }}>
          ✅ Saara inventory normal range mein hai!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {data.anomalies.map((item, i) => (
            <div key={i} style={{
              background: theme.bg, borderRadius: "10px",
              padding: "14px 18px",
              border: `1px solid ${item.Anomaly_Type === "Critically Low" ? "#ffcccc" : "#fef3c7"}`,
              display: "flex", justifyContent: "space-between",
              alignItems: "center", flexWrap: "wrap", gap: "12px"
            }}>
              {/* Left */}
              <div>
                <div style={{ fontWeight: "600", color: theme.text, fontSize: "0.95rem" }}>
                  {item.Description}
                </div>
                <div style={{ color: theme.subText, fontSize: "0.82rem", marginTop: "2px" }}>
                  {item.Material_ID} | {item.Plant}
                </div>
              </div>

              {/* Middle */}
              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontSize: "1.2rem", fontWeight: "bold",
                    color: item.Anomaly_Type === "Critically Low" ? "#e63946" : "#f4a261"
                  }}>
                    {item.Stock_Qty}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: theme.subText }}>
                    Current
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: theme.text }}>
                    {item.Average_Stock}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: theme.subText }}>
                    Average
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#4361ee" }}>
                    {item.Z_Score}σ
                  </div>
                  <div style={{ fontSize: "0.75rem", color: theme.subText }}>
                    Z-Score
                  </div>
                </div>
              </div>

              {/* Right — Badges */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span style={{
                  background: item.Anomaly_Type === "Critically Low" ? "#fff5f5" : "#fffbeb",
                  color: item.Anomaly_Type === "Critically Low" ? "#e63946" : "#f4a261",
                  padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem",
                  fontWeight: "600"
                }}>
                  {item.Anomaly_Type === "Critically Low" ? "📉 Critically Low" : "📈 Unusually High"}
                </span>
                <span style={{
                  background: item.Severity.includes("High") ? "#fff5f5" : "#fffbeb",
                  color: item.Severity.includes("High") ? "#e63946" : "#f4a261",
                  padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem"
                }}>
                  {item.Severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {data.total_anomalies > 0 && (
        <div style={{
          marginTop: "16px", padding: "12px 16px",
          background: theme.bg, borderRadius: "8px",
          fontSize: "0.82rem", color: theme.subText,
          border: `1px solid ${theme.border}`
        }}>
          💡 <strong>Z-Score Method:</strong> Items with stock deviating more than 2 standard deviations from their material average are flagged as anomalies.
        </div>
      )}
    </div>
  );
}

export default AnomalyDetection;