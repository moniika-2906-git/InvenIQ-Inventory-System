import { useState, useEffect } from "react";

function OrderHistory({ theme }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stockAlert, setStockAlert] = useState(null);

  const fetchOrders = () => {
    fetch("http://localhost:5000/api/purchase-orders")
      .then(r => r.json())
      .then(d => { setOrders(d); setLoading(false); });
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id, status, materialId) => {
    const res = await fetch(`http://localhost:5000/api/purchase-orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const result = await res.json();

    if (result.stock_updated) {
      setStockAlert({
        material: materialId,
        newStock: result.new_stock
      });
      setTimeout(() => setStockAlert(null), 4000);
    }

    fetchOrders();
  };

  const statusColor = {
    "Pending": "#f4a261",
    "Approved": "#4361ee",
    "Delivered": "#2a9d8f",
    "Cancelled": "#e63946"
  };

  if (loading) return (
    <div style={{ background: theme.cardBg, borderRadius: "12px", padding: "40px", textAlign: "center", color: theme.text }}>
      🔄 Orders load ho rahe hain...
    </div>
  );

  return (
    <div>
      {/* Stock Update Toast */}
      {stockAlert && (
        <div style={{
          position: "fixed", top: "20px", right: "20px",
          background: "#2a9d8f", color: "white",
          padding: "16px 24px", borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          zIndex: 3000
        }}>
          <div style={{ fontWeight: "600" }}>✅ Stock Updated!</div>
          <div style={{ fontSize: "0.85rem", opacity: 0.9, marginTop: "4px" }}>
            {stockAlert.material} → New Stock: {stockAlert.newStock}
          </div>
        </div>
      )}

      {/* Main Card */}
      <div style={{
        background: theme.cardBg, borderRadius: "12px",
        padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "20px"
        }}>
          <div>
            <h3 style={{ margin: 0, color: theme.text }}>📦 Purchase Order History</h3>
            <p style={{ margin: "4px 0 0", color: theme.subText, fontSize: "0.85rem" }}>
              Total Orders: {orders.length}
            </p>
          </div>
          <button
            onClick={fetchOrders}
            style={{
              background: theme.bg, color: theme.text,
              border: `1px solid ${theme.border}`,
              padding: "8px 16px", borderRadius: "8px", cursor: "pointer"
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: theme.subText }}>
            📋 Abhi koi purchase order nahi hai
            <br />
            <span style={{ fontSize: "0.85rem" }}>Reorder Analysis se order place karo</span>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ background: theme.bg }}>
                  {["PO Number", "Material", "Supplier", "Qty", "Total Cost", "Created", "Delivery", "Status", "Action"].map(h => (
                    <th key={h} style={{
                      padding: "10px 12px", textAlign: "left",
                      borderBottom: `2px solid ${theme.border}`,
                      color: theme.text, whiteSpace: "nowrap"
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <td style={{ padding: "10px 12px", color: "#4361ee", fontWeight: "600" }}>
                      {order.po_number}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: "600", color: theme.text }}>
                        {order.description?.substring(0, 18)}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: theme.subText }}>
                        {order.material_id}
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", color: theme.text }}>{order.supplier}</td>
                    <td style={{ padding: "10px 12px", color: theme.text }}>
                      {order.quantity} {order.unit}
                    </td>
                    <td style={{ padding: "10px 12px", color: theme.text, fontWeight: "600" }}>
                      ₹{Number(order.total_cost).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: "10px 12px", color: theme.subText, fontSize: "0.82rem" }}>
                      {order.created_at?.substring(0, 10)}
                    </td>
                    <td style={{ padding: "10px 12px", color: theme.subText, fontSize: "0.82rem" }}>
                      {order.expected_delivery}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        background: statusColor[order.status] + "22",
                        color: statusColor[order.status],
                        padding: "3px 10px", borderRadius: "20px",
                        fontSize: "0.8rem", fontWeight: "600"
                      }}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <select
                        value={order.status}
                        onChange={e => updateStatus(order.id, e.target.value, order.material_id)}
                        style={{
                          padding: "4px 8px", borderRadius: "6px",
                          border: `1px solid ${theme.border}`,
                          background: theme.inputBg, color: theme.text,
                          fontSize: "0.8rem", cursor: "pointer"
                        }}
                      >
                        <option>Pending</option>
                        <option>Approved</option>
                        <option>Delivered</option>
                        <option>Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderHistory;