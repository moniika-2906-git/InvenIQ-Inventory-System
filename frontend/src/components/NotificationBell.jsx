import { useState } from "react";

function NotificationBell({ inventory, theme }) {
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  if (!inventory) return null;

  const lowItems = inventory.filter(item => item.Low_Stock === true);
  const count = lowItems.length;

  const shortage = (item) => item.Min_Stock_Level - item.Stock_Qty;
  const healthPercent = (item) => Math.round((item.Stock_Qty / item.Min_Stock_Level) * 100);

  return (
    <div style={{ position: "relative" }}>

      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "rgba(255,255,255,0.15)",
          color: "white", border: "1px solid rgba(255,255,255,0.3)",
          padding: "10px 14px", borderRadius: "8px",
          cursor: "pointer", fontSize: "1.1rem",
          position: "relative"
        }}
      >
        🔔
        {count > 0 && (
          <span style={{
            position: "absolute", top: "-6px", right: "-6px",
            background: "#e63946", color: "white",
            borderRadius: "50%", width: "20px", height: "20px",
            fontSize: "0.7rem", fontWeight: "bold",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            {count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
    <div style={{
      position: "fixed",
      top: "70px",
      right: "16px",
          width: "340px", background: theme.cardBg,
          borderRadius: "12px", boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
          border: `1px solid ${theme.border}`,
          zIndex: 1000, overflow: "hidden"
        }}>
          {/* Header */}
          <div style={{
            padding: "14px 18px",
            borderBottom: `1px solid ${theme.border}`,
            display: "flex", justifyContent: "space-between",
            alignItems: "center"
          }}>
            <span style={{ fontWeight: "600", color: theme.text }}>
              🔔 Low Stock Alerts ({count})
            </span>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "none", border: "none",
                cursor: "pointer", color: theme.subText, fontSize: "1rem"
              }}
            >✕</button>
          </div>

          {/* List */}
          <div style={{ maxHeight: "360px", overflowY: "auto" }}>
            {count === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: theme.subText }}>
                ✅ Koi low stock alert nahi!
              </div>
            ) : (
              lowItems.map((item, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setSelectedItem(item);
                    setOpen(false);
                  }}
                  style={{
                    padding: "12px 18px",
                    borderBottom: `1px solid ${theme.border}`,
                    display: "flex", gap: "12px",
                    alignItems: "center", cursor: "pointer",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = theme.bg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {/* Icon */}
                  <div style={{
                    background: "#fff5f5", borderRadius: "8px",
                    padding: "8px", fontSize: "1.2rem", flexShrink: 0
                  }}>
                    ⚠️
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "600", color: theme.text, fontSize: "0.88rem" }}>
                      {item.Description}
                    </div>
                    <div style={{ color: theme.subText, fontSize: "0.78rem", marginTop: "2px" }}>
                      {item.Material_ID} | {item.Plant}
                    </div>
                    {/* Mini progress bar */}
                    <div style={{
                      marginTop: "6px", background: theme.border,
                      borderRadius: "10px", height: "5px", width: "100%"
                    }}>
                      <div style={{
                        background: "#e63946", borderRadius: "10px",
                        height: "5px",
                        width: `${Math.min(healthPercent(item), 100)}%`
                      }} />
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#e63946", marginTop: "3px" }}>
                      Stock: {item.Stock_Qty} / Min: {item.Min_Stock_Level}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div style={{ color: theme.subText, fontSize: "0.9rem" }}>›</div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {count > 0 && (
            <div style={{
              padding: "10px 18px",
              borderTop: `1px solid ${theme.border}`,
              textAlign: "center"
            }}>
              <span style={{ color: "#e63946", fontSize: "0.82rem", fontWeight: "600" }}>
                🚨 {count} materials need immediate attention!
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selectedItem && (
        <div
          onClick={() => setSelectedItem(null)}
          style={{
            position: "fixed", top: 0, left: 0,
            width: "100vw", height: "100vh",
            background: "rgba(0,0,0,0.5)",
            zIndex: 2000, display: "flex",
            alignItems: "center", justifyContent: "center"
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: theme.cardBg, borderRadius: "16px",
              padding: "32px", width: "100%", maxWidth: "480px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              margin: "16px"
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "flex-start", marginBottom: "24px"
            }}>
              <div>
                <h2 style={{ margin: 0, color: theme.text, fontSize: "1.2rem" }}>
                  ⚠️ {selectedItem.Description}
                </h2>
                <p style={{ margin: "4px 0 0", color: theme.subText, fontSize: "0.85rem" }}>
                  {selectedItem.Material_ID} | {selectedItem.Category}
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                style={{
                  background: theme.bg, border: `1px solid ${theme.border}`,
                  borderRadius: "8px", padding: "6px 12px",
                  cursor: "pointer", color: theme.text, fontSize: "1rem"
                }}
              >✕</button>
            </div>

            {/* Stock Level Visual */}
            <div style={{
              background: theme.bg, borderRadius: "12px",
              padding: "20px", marginBottom: "20px"
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                marginBottom: "10px"
              }}>
                <span style={{ color: theme.subText, fontSize: "0.85rem" }}>
                  Stock Level
                </span>
                <span style={{
                  color: "#e63946", fontWeight: "bold", fontSize: "0.85rem"
                }}>
                  {healthPercent(selectedItem)}% of minimum
                </span>
              </div>

              {/* Big Progress Bar */}
              <div style={{
                background: theme.border, borderRadius: "10px",
                height: "16px", width: "100%", overflow: "hidden"
              }}>
                <div style={{
                  background: healthPercent(selectedItem) > 50 ? "#f4a261" : "#e63946",
                  borderRadius: "10px", height: "16px",
                  width: `${Math.min(healthPercent(selectedItem), 100)}%`,
                  transition: "width 0.8s ease"
                }} />
              </div>

              {/* Stock Numbers */}
              <div style={{
                display: "flex", justifyContent: "space-between",
                marginTop: "8px"
              }}>
                <span style={{ color: "#e63946", fontSize: "0.82rem" }}>
                  Current: <strong>{selectedItem.Stock_Qty} {selectedItem.Unit}</strong>
                </span>
                <span style={{ color: theme.subText, fontSize: "0.82rem" }}>
                  Minimum: <strong>{selectedItem.Min_Stock_Level} {selectedItem.Unit}</strong>
                </span>
              </div>
            </div>

            {/* Info Grid */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: "12px", marginBottom: "20px"
            }}>
              {[
                { label: "🏭 Plant", value: selectedItem.Plant },
                { label: "📦 Unit", value: selectedItem.Unit },
                { label: "🏢 Supplier", value: selectedItem.Supplier },
                { label: "💰 Unit Price", value: `₹${selectedItem.Unit_Price_INR?.toLocaleString('en-IN')}` },
              ].map((info, i) => (
                <div key={i} style={{
                  background: theme.bg, borderRadius: "10px",
                  padding: "12px 14px",
                  border: `1px solid ${theme.border}`
                }}>
                  <div style={{ color: theme.subText, fontSize: "0.78rem" }}>
                    {info.label}
                  </div>
                  <div style={{
                    color: theme.text, fontWeight: "600",
                    fontSize: "0.95rem", marginTop: "4px"
                  }}>
                    {info.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Shortage Alert */}
            <div style={{
              background: "#fff5f5",
              border: "1px solid #ffcccc",
              borderRadius: "10px", padding: "14px 18px",
              marginBottom: "20px"
            }}>
              <div style={{ color: "#e63946", fontWeight: "600", fontSize: "0.9rem" }}>
                🚨 Shortage: {shortage(selectedItem)} {selectedItem.Unit}
              </div>
              <div style={{ color: "#c0392b", fontSize: "0.82rem", marginTop: "4px" }}>
                Minimum {shortage(selectedItem)} {selectedItem.Unit} order karna zaroori hai
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setSelectedItem(null)}
                style={{
                  flex: 1, padding: "12px",
                  background: theme.bg, color: theme.text,
                  border: `1px solid ${theme.border}`,
                  borderRadius: "8px", cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert(`Purchase Order raised for:\n${selectedItem.Description}\nQuantity: ${shortage(selectedItem)} ${selectedItem.Unit}\nSupplier: ${selectedItem.Supplier}`);
                  setSelectedItem(null);
                }}
                style={{
                  flex: 2, padding: "12px",
                  background: "#4361ee", color: "white",
                  border: "none", borderRadius: "8px",
                  cursor: "pointer", fontWeight: "600"
                }}
              >
                📋 Raise Purchase Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;