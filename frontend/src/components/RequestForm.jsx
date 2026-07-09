import { useState, useEffect } from "react";

function RequestForm({ inventory, user, theme, onSuccess }) {
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [urgency, setUrgency] = useState("Normal");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [myRequests, setMyRequests] = useState([]);

  const fetchMyRequests = () => {
    fetch("http://localhost:5000/api/requests")
      .then(r => r.json())
      .then(data => {
        const mine = data.filter(r => r.requested_by === user.name);
        setMyRequests(mine);
      });
  };

  useEffect(() => {
    if (user.role === "Viewer") {
      fetchMyRequests();
    }
  }, [user.name, user.role]);

  if (!inventory) return null;

  const lowStockItems = inventory.filter(i => i.Low_Stock === true);
  const searchedItems = inventory.filter(i =>
    i.Description.toLowerCase().includes(search.toLowerCase()) ||
    i.Material_ID.toLowerCase().includes(search.toLowerCase())
  );

  const submitRequest = async () => {
    if (!selectedMaterial || !quantity || !reason) {
      alert("Sabhi fields fill karo!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          material_id: selectedMaterial.Material_ID,
          description: selectedMaterial.Description,
          category: selectedMaterial.Category,
          plant: selectedMaterial.Plant,
          current_stock: selectedMaterial.Stock_Qty,
          min_stock: selectedMaterial.Min_Stock_Level,
          requested_quantity: parseInt(quantity),
          unit: selectedMaterial.Unit,
          unit_price: selectedMaterial.Unit_Price_INR,
          reason: reason,
          urgency: urgency,
          requested_by: user.name,
          requested_by_role: user.role
        })
      });

      const data = await res.json();
      
      if (data.success) {
        fetchMyRequests();
        onSuccess(data.request_number);
        setSelectedMaterial(null);
        setQuantity("");
        setReason("");
        setSearch("");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  };

  const urgencyConfig = {
    "Normal": { color: "#10B981", bg: "#10B98115" },
    "High": { color: "#F59E0B", bg: "#F59E0B15" },
    "Critical": { color: "#EF4444", bg: "#EF444415" }
  };

  const statusConfig = {
    "Pending": { color: "#F59E0B", bg: "#F59E0B15" },
    "Manager Approved": { color: "#6366F1", bg: "#6366F115" },
    "PO Created": { color: "#10B981", bg: "#10B98115" },
    "Rejected": { color: "#EF4444", bg: "#EF444415" },
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>

        {/* Left — Request Form */}
        <div style={{
          flex: 2, minWidth: "300px",
          background: theme.cardBg, borderRadius: "16px",
          padding: "24px", border: `1px solid ${theme.border}`
        }}>
          <h3 style={{ margin: "0 0 20px", color: theme.text, fontSize: "1rem", fontWeight: "700" }}>
            📋 New Stock Request
          </h3>

          {/* Material Search */}
          <div style={{ marginBottom: "16px", position: "relative" }}>
            <label style={{
              display: "block", fontSize: "0.82rem", fontWeight: "600",
              color: theme.subText, marginBottom: "6px",
              textTransform: "uppercase", letterSpacing: "0.05em"
            }}>
              Select Material
            </label>
            <input
              placeholder="Search material..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setShowDropdown(true);
                setSelectedMaterial(null);
              }}
              onFocus={() => setShowDropdown(true)}
              style={{
                width: "100%", padding: "10px 14px",
                borderRadius: "10px",
                border: `1.5px solid ${selectedMaterial ? "#6366F1" : theme.inputBorder}`,
                background: theme.inputBg, color: theme.text,
                fontSize: "0.9rem", outline: "none", boxSizing: "border-box"
              }}
            />

            {showDropdown && search && (
              <div style={{
                position: "absolute", top: "100%", left: 0, right: 0,
                background: theme.cardBg, border: `1px solid ${theme.border}`,
                borderRadius: "10px", zIndex: 100,
                maxHeight: "200px", overflowY: "auto",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)", marginTop: "4px"
              }}>
                {searchedItems.slice(0, 8).map((item, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSelectedMaterial(item);
                      setSearch(item.Description);
                      setShowDropdown(false);
                      setQuantity(String(
                        item.Min_Stock_Level - item.Stock_Qty > 0
                          ? item.Min_Stock_Level - item.Stock_Qty
                          : item.Min_Stock_Level
                      ));
                    }}
                    style={{
                      padding: "10px 14px", cursor: "pointer",
                      borderBottom: `1px solid ${theme.border}`,
                      transition: "background 0.15s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = theme.hover}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: "600", color: theme.text, fontSize: "0.88rem" }}>
                          {item.Description}
                        </div>
                        <div style={{ color: theme.subText, fontSize: "0.75rem" }}>
                          {item.Material_ID} · {item.Plant}
                        </div>
                      </div>
                      <span style={{
                        background: item.Low_Stock ? "#EF444415" : "#10B98115",
                        color: item.Low_Stock ? "#EF4444" : "#10B981",
                        padding: "2px 8px", borderRadius: "6px",
                        fontSize: "0.75rem", fontWeight: "600"
                      }}>
                        {item.Stock_Qty} {item.Unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Material Info */}
          {selectedMaterial && (
            <div style={{
              background: "#6366F110", border: "1px solid #6366F130",
              borderRadius: "10px", padding: "12px 16px", marginBottom: "16px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                {[
                  { label: "Current Stock", value: `${selectedMaterial.Stock_Qty} ${selectedMaterial.Unit}`, color: selectedMaterial.Low_Stock ? "#EF4444" : "#10B981" },
                  { label: "Min Level", value: `${selectedMaterial.Min_Stock_Level} ${selectedMaterial.Unit}`, color: theme.text },
                  { label: "Unit Price", value: `₹${selectedMaterial.Unit_Price_INR?.toLocaleString('en-IN')}`, color: theme.text },
                  { label: "Supplier", value: selectedMaterial.Supplier, color: "#6366F1" },
                ].map((info, i) => (
                  <div key={i}>
                    <div style={{ fontSize: "0.72rem", color: theme.subText }}>{info.label}</div>
                    <div style={{ fontSize: "0.88rem", fontWeight: "700", color: info.color }}>{info.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{
              display: "block", fontSize: "0.82rem", fontWeight: "600",
              color: theme.subText, marginBottom: "6px",
              textTransform: "uppercase", letterSpacing: "0.05em"
            }}>
              Quantity Required
            </label>
            <input
              type="number"
              placeholder="Enter quantity"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: "10px",
                border: `1.5px solid ${theme.inputBorder}`,
                background: theme.inputBg, color: theme.text,
                fontSize: "0.9rem", outline: "none", boxSizing: "border-box"
              }}
              onFocus={e => e.target.style.border = "1.5px solid #6366F1"}
              onBlur={e => e.target.style.border = `1.5px solid ${theme.inputBorder}`}
            />
          </div>

          {/* Urgency */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{
              display: "block", fontSize: "0.82rem", fontWeight: "600",
              color: theme.subText, marginBottom: "8px",
              textTransform: "uppercase", letterSpacing: "0.05em"
            }}>
              Urgency Level
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {Object.entries(urgencyConfig).map(([level, config]) => (
                <button
                  key={level}
                  onClick={() => setUrgency(level)}
                  style={{
                    flex: 1, padding: "8px", borderRadius: "8px",
                    border: "none", cursor: "pointer", fontWeight: "600",
                    fontSize: "0.82rem", transition: "all 0.2s",
                    background: urgency === level ? config.color : config.bg,
                    color: urgency === level ? "white" : config.color,
                    outline: urgency === level ? `2px solid ${config.color}` : "none"
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block", fontSize: "0.82rem", fontWeight: "600",
              color: theme.subText, marginBottom: "6px",
              textTransform: "uppercase", letterSpacing: "0.05em"
            }}>
              Reason for Request
            </label>
            <textarea
              placeholder="Why is this stock needed?"
              value={reason}
              onChange={e => setReason(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: "10px",
                border: `1.5px solid ${theme.inputBorder}`,
                background: theme.inputBg, color: theme.text,
                fontSize: "0.9rem", outline: "none",
                boxSizing: "border-box", resize: "vertical", minHeight: "90px"
              }}
              onFocus={e => e.target.style.border = "1.5px solid #6366F1"}
              onBlur={e => e.target.style.border = `1.5px solid ${theme.inputBorder}`}
            />
          </div>

          {/* Cost Preview */}
          {selectedMaterial && quantity && (
            <div style={{
              background: "#10B98110", border: "1px solid #10B98130",
              borderRadius: "10px", padding: "12px 16px", marginBottom: "16px",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <span style={{ color: theme.subText, fontSize: "0.85rem" }}>Estimated Cost:</span>
              <span style={{ color: "#10B981", fontWeight: "800", fontSize: "1.1rem" }}>
                ₹{(parseInt(quantity || 0) * selectedMaterial.Unit_Price_INR).toLocaleString('en-IN')}
              </span>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={submitRequest}
            disabled={loading || !selectedMaterial || !quantity || !reason}
            style={{
              width: "100%", padding: "13px",
              background: (loading || !selectedMaterial || !quantity || !reason)
                ? theme.border
                : "linear-gradient(135deg, #6366F1, #06B6D4)",
              color: (loading || !selectedMaterial || !quantity || !reason)
                ? theme.subText : "white",
              border: "none", borderRadius: "10px",
              fontWeight: "700", fontSize: "0.95rem",
              cursor: (loading || !selectedMaterial || !quantity || !reason)
                ? "not-allowed" : "pointer",
              transition: "all 0.2s"
            }}
          >
            {loading ? "Submitting..." : "📤 Submit Request"}
          </button>
        </div>

        {/* Right — Low Stock Quick Select */}
        <div style={{
          flex: 1, minWidth: "250px",
          background: theme.cardBg, borderRadius: "16px",
          padding: "24px", border: `1px solid ${theme.border}`,
          maxHeight: "500px", overflowY: "auto"
        }}>
          <h3 style={{ margin: "0 0 4px", color: theme.text, fontSize: "0.95rem", fontWeight: "700" }}>
            ⚠️ Low Stock Items
          </h3>
          <p style={{ color: theme.subText, fontSize: "0.78rem", marginBottom: "16px" }}>
            Click to quickly select
          </p>

          {lowStockItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px", color: theme.subText }}>
              ✅ No low stock items!
            </div>
          ) : (
            lowStockItems.map((item, i) => (
              <div
                key={i}
                onClick={() => {
                  setSelectedMaterial(item);
                  setSearch(item.Description);
                  setShowDropdown(false);
                  setQuantity(String(Math.max(
                    item.Min_Stock_Level - item.Stock_Qty,
                    item.Min_Stock_Level
                  )));
                }}
                style={{
                  padding: "12px", borderRadius: "10px",
                  border: `1px solid ${selectedMaterial?.Material_ID === item.Material_ID
                    ? "#6366F1" : theme.border}`,
                  marginBottom: "8px", cursor: "pointer",
                  background: selectedMaterial?.Material_ID === item.Material_ID
                    ? "#6366F110" : theme.bg,
                  transition: "all 0.2s"
                }}
              >
                <div style={{ fontWeight: "600", color: theme.text, fontSize: "0.85rem", marginBottom: "4px" }}>
                  {item.Description}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: theme.subText }}>
                    {item.Material_ID} · {item.Plant}
                  </span>
                  <span style={{
                    background: "#EF444415", color: "#EF4444",
                    padding: "2px 8px", borderRadius: "6px",
                    fontSize: "0.75rem", fontWeight: "600"
                  }}>
                    {item.Stock_Qty}/{item.Min_Stock_Level}
                  </span>
                </div>
                <div style={{
                  marginTop: "6px", background: theme.border,
                  borderRadius: "4px", height: "4px"
                }}>
                  <div style={{
                    background: "#EF4444", height: "4px", borderRadius: "4px",
                    width: `${Math.min((item.Stock_Qty / item.Min_Stock_Level) * 100, 100)}%`
                  }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* My Requests Status Tracker */}
      {myRequests.length > 0 && (
        <div style={{
          background: theme.cardBg, borderRadius: "16px",
          padding: "24px", border: `1px solid ${theme.border}`,
          marginTop: "20px"
        }}>
          <h3 style={{ margin: "0 0 16px", color: theme.text, fontWeight: "700" }}>
            📬 My Requests Status
          </h3>

          {myRequests.map((req, i) => {
            const steps = [
              {
                label: "Submitted",
                done: true,
                info: `${req.requested_at?.substring(0, 10)}`,
                color: "#6366F1"
              },
              {
                label: "Manager Review",
                done: ["Manager Approved", "PO Created", "Rejected"].includes(req.status),
                info: req.manager_name
                  ? `${req.manager_action} by ${req.manager_name}`
                  : "Waiting...",
                color: req.manager_action === "Rejected" ? "#EF4444" : "#F59E0B"
              },
              {
                label: "Admin Approval",
                done: req.admin_name != null,
                info: req.admin_name
                  ? `${req.admin_action} by ${req.admin_name}`
                  : "Waiting...",
                color: req.admin_action === "Rejected" ? "#EF4444" : "#10B981"
              },
              {
                label: "PO Created",
                done: req.status === "PO Created",
                info: req.po_number || "Pending",
                color: "#10B981"
              },
            ];

            return (
              <div key={i} style={{
                background: theme.bg, borderRadius: "12px",
                padding: "16px 20px", marginBottom: "12px",
                border: `1px solid ${theme.border}`
              }}>
                {/* Header */}
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px"
                }}>
                  <div>
                    <div style={{ fontWeight: "700", color: theme.text }}>
                      {req.description}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: theme.subText }}>
                      {req.request_number} · {req.requested_quantity} {req.unit}
                    </div>
                  </div>
                  <span style={{
                    background: statusConfig[req.status]?.bg,
                    color: statusConfig[req.status]?.color,
                    padding: "4px 12px", borderRadius: "20px",
                    fontSize: "0.78rem", fontWeight: "700"
                  }}>
                    {req.status}
                  </span>
                </div>

                {/* Progress Steps */}
                <div style={{ position: "relative", marginBottom: "16px" }}>
                  <div style={{
                    position: "absolute", top: "16px", left: "16px", right: "16px",
                    height: "2px", background: theme.border, zIndex: 0
                  }} />
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    position: "relative", zIndex: 1
                  }}>
                    {steps.map((step, si) => (
                      <div key={si} style={{
                        display: "flex", flexDirection: "column",
                        alignItems: "center", flex: 1
                      }}>
                        <div style={{
                          width: "32px", height: "32px", borderRadius: "50%",
                          background: step.done ? step.color : theme.cardBg,
                          border: `2px solid ${step.done ? step.color : theme.border}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          marginBottom: "8px", transition: "all 0.3s"
                        }}>
                          {step.done
                            ? <span style={{ color: "white", fontSize: "0.8rem" }}>✓</span>
                            : <span style={{ color: theme.subText, fontSize: "0.7rem" }}>{si + 1}</span>
                          }
                        </div>
                        <div style={{
                          fontSize: "0.72rem", fontWeight: "600",
                          color: step.done ? theme.text : theme.subText,
                          textAlign: "center", marginBottom: "4px"
                        }}>
                          {step.label}
                        </div>
                        <div style={{
                          fontSize: "0.68rem", color: theme.subText,
                          textAlign: "center", maxWidth: "80px", lineHeight: 1.3
                        }}>
                          {step.info}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PO Created */}
                {req.po_number && (
                  <div style={{
                    padding: "12px 16px",
                    background: "#10B98110", border: "1px solid #10B98130",
                    borderRadius: "10px",
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", flexWrap: "wrap", gap: "8px"
                  }}>
                    <div>
                      <div style={{ fontWeight: "700", color: "#10B981", fontSize: "0.9rem" }}>
                        ✅ Purchase Order Created!
                      </div>
                      <div style={{ color: theme.subText, fontSize: "0.78rem" }}>
                        {req.po_number}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: theme.subText, fontSize: "0.75rem" }}>Expected Delivery</div>
                      <div style={{ fontWeight: "700", color: theme.text, fontSize: "0.9rem" }}>
                        7-14 Business Days
                      </div>
                    </div>
                  </div>
                )}

                {/* Rejected */}
                {req.status === "Rejected" && (
                  <div style={{
                    padding: "10px 14px",
                    background: "#EF444410", border: "1px solid #EF444430",
                    borderRadius: "8px", color: "#EF4444", fontSize: "0.82rem"
                  }}>
                    ❌ Request rejected.
                    {(req.manager_comment || req.admin_comment) && (
                      <span> Reason: {req.manager_comment || req.admin_comment}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RequestForm;