import { api } from '../utils/api';
import { useState, useEffect } from "react";

function RequestList({ user, theme }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [actionModal, setActionModal] = useState(null);
  const [comment, setComment] = useState("");
  const [toast, setToast] = useState(null);

  const fetchRequests = () => {
  api.get('/api/requests')
    .then(r => r?.json())
    .then(d => { if(d) { setRequests(d); setLoading(false); } });
};

  useEffect(() => { fetchRequests(); }, []);

  const showToast = (msg, color = "#10B981") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  const handleManagerAction = async (reqId, action) => {
  const res = await api.put(`/api/requests/${reqId}/manager`, {
    action, comment, manager_name: user.name
  });
  const result = await res?.json();
  if (result?.success) {
    showToast(`✅ Request ${action} by ${user.name}!`);
    setActionModal(null);
    setComment("");
    fetchRequests();
  }
};
  const handleAdminAction = async (reqId, action) => {
    const res = await fetch(`http://localhost:5000/api/requests/${reqId}/admin`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action, comment,
        admin_name: user.name
      })
    });
    const result = await res.json();
    if (result.success) {
      showToast(
        action === 'Approved'
          ? `✅ PO Created: ${result.po_number}!`
          : `❌ Request Rejected!`,
        action === 'Approved' ? "#10B981" : "#EF4444"
      );
      setActionModal(null);
      setComment("");
      fetchRequests();
    }
  };

  const statusConfig = {
    "Pending": { color: "#F59E0B", bg: "#F59E0B15", label: "⏳ Pending" },
    "Manager Approved": { color: "#6366F1", bg: "#6366F115", label: "✅ Manager Approved" },
    "PO Created": { color: "#10B981", bg: "#10B98115", label: "📋 PO Created" },
    "Rejected": { color: "#EF4444", bg: "#EF444415", label: "❌ Rejected" },
  };

  const urgencyConfig = {
    "Normal": { color: "#10B981" },
    "High": { color: "#F59E0B" },
    "Critical": { color: "#EF4444" },
  };

  const filters = ["All", "Pending", "Manager Approved", "PO Created", "Rejected"];

  const filteredRequests = filter === "All"
    ? requests
    : requests.filter(r => r.status === filter);

  if (loading) return (
    <div style={{
      background: theme.cardBg, borderRadius: "16px",
      padding: "40px", textAlign: "center", color: theme.text
    }}>
      🔄 Loading requests...
    </div>
  );

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "20px", right: "20px",
          background: toast.color, color: "white",
          padding: "14px 20px", borderRadius: "10px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          zIndex: 3000, fontWeight: "600",
          animation: "slideIn 0.3s ease"
        }}>
          {toast.msg}
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div
          onClick={() => setActionModal(null)}
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
              padding: "28px", width: "100%", maxWidth: "440px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)", margin: "16px"
            }}
          >
            <h3 style={{ margin: "0 0 6px", color: theme.text }}>
              {actionModal.type === 'manager' ? '👨‍💼 Manager Action' : '👨‍💻 Admin Action'}
            </h3>
            <p style={{ color: theme.subText, fontSize: "0.85rem", marginBottom: "20px" }}>
              {actionModal.req.description} · {actionModal.req.request_number}
            </p>

            {/* Request Summary */}
            <div style={{
              background: theme.bg, borderRadius: "10px",
              padding: "14px", marginBottom: "16px"
            }}>
              {[
                ["Requested By", `${actionModal.req.requested_by} (${actionModal.req.requested_by_role})`],
                ["Quantity", `${actionModal.req.requested_quantity} ${actionModal.req.unit}`],
                ["Urgency", actionModal.req.urgency],
                ["Reason", actionModal.req.reason],
                ["Est. Cost", `₹${(actionModal.req.requested_quantity * actionModal.req.unit_price).toLocaleString('en-IN')}`],
              ].map(([label, value], i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "5px 0",
                  borderBottom: i < 4 ? `1px solid ${theme.border}` : "none"
                }}>
                  <span style={{ color: theme.subText, fontSize: "0.82rem" }}>{label}</span>
                  <span style={{ color: theme.text, fontWeight: "600", fontSize: "0.82rem" }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Comment */}
            <textarea
              placeholder="Add comment (optional)..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px",
                borderRadius: "10px",
                border: `1.5px solid ${theme.inputBorder}`,
                background: theme.inputBg, color: theme.text,
                fontSize: "0.88rem", outline: "none",
                boxSizing: "border-box", resize: "vertical",
                minHeight: "80px", marginBottom: "16px"
              }}
            />

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setActionModal(null)}
                style={{
                  flex: 1, padding: "11px",
                  background: theme.bg, color: theme.text,
                  border: `1px solid ${theme.border}`,
                  borderRadius: "10px", cursor: "pointer", fontWeight: "600"
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (actionModal.type === 'manager') {
                    handleManagerAction(actionModal.req.id, 'Rejected');
                  } else {
                    handleAdminAction(actionModal.req.id, 'Rejected');
                  }
                }}
                style={{
                  flex: 1, padding: "11px",
                  background: "#EF444415", color: "#EF4444",
                  border: "1px solid #EF444430",
                  borderRadius: "10px", cursor: "pointer", fontWeight: "700"
                }}
              >
                ❌ Reject
              </button>
              <button
                onClick={() => {
                  if (actionModal.type === 'manager') {
                    handleManagerAction(actionModal.req.id, 'Approved');
                  } else {
                    handleAdminAction(actionModal.req.id, 'Approved');
                  }
                }}
                style={{
                  flex: 2, padding: "11px",
                  background: "linear-gradient(135deg, #6366F1, #06B6D4)",
                  color: "white", border: "none",
                  borderRadius: "10px", cursor: "pointer", fontWeight: "700"
                }}
              >
                {actionModal.type === 'admin' ? '✅ Approve & Create PO' : '✅ Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div style={{
        background: theme.cardBg, borderRadius: "16px",
        padding: "24px", border: `1px solid ${theme.border}`
      }}>
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px"
        }}>
          <div>
            <h3 style={{ margin: 0, color: theme.text, fontWeight: "700" }}>
              📬 Order Requests
            </h3>
            <p style={{ margin: "4px 0 0", color: theme.subText, fontSize: "0.82rem" }}>
              {filteredRequests.length} requests · Manage approval workflow
            </p>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "5px 12px", borderRadius: "20px",
                  border: "none", cursor: "pointer", fontSize: "0.8rem",
                  background: filter === f ? "#6366F1" : theme.bg,
                  color: filter === f ? "white" : theme.subText,
                  fontWeight: filter === f ? "600" : "400"
                }}
              >
                {f} {f !== "All" && `(${requests.filter(r => r.status === f).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px", color: theme.subText
          }}>
            📭 Koi request nahi hai
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredRequests.map((req, i) => (
              <div key={i} style={{
                background: theme.bg, borderRadius: "12px",
                padding: "16px 20px",
                border: `1px solid ${req.status === 'Pending' ? "#F59E0B30" : theme.border}`,
              }}>
                {/* Top Row */}
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", flexWrap: "wrap", gap: "8px",
                  marginBottom: "12px"
                }}>
                  <div>
                    <div style={{
                      fontWeight: "700", color: theme.text, fontSize: "0.95rem"
                    }}>
                      {req.description}
                    </div>
                    <div style={{
                      color: theme.subText, fontSize: "0.78rem", marginTop: "2px"
                    }}>
                      {req.request_number} · {req.material_id} · {req.plant}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {/* Urgency */}
                    <span style={{
                      background: urgencyConfig[req.urgency]?.color + "15",
                      color: urgencyConfig[req.urgency]?.color,
                      padding: "3px 10px", borderRadius: "20px",
                      fontSize: "0.75rem", fontWeight: "600"
                    }}>
                      {req.urgency}
                    </span>

                    {/* Status */}
                    <span style={{
                      background: statusConfig[req.status]?.bg,
                      color: statusConfig[req.status]?.color,
                      padding: "3px 10px", borderRadius: "20px",
                      fontSize: "0.75rem", fontWeight: "600"
                    }}>
                      {statusConfig[req.status]?.label}
                    </span>
                  </div>
                </div>

                {/* Details Row */}
                <div style={{
                  display: "flex", gap: "16px", flexWrap: "wrap",
                  marginBottom: "12px"
                }}>
                  {[
                    { label: "Requested By", value: `${req.requested_by} (${req.requested_by_role})` },
                    { label: "Quantity", value: `${req.requested_quantity} ${req.unit}` },
                    { label: "Est. Cost", value: `₹${(req.requested_quantity * req.unit_price).toLocaleString('en-IN')}` },
                    { label: "Date", value: req.requested_at?.substring(0, 10) },
                  ].map((info, i) => (
                    <div key={i}>
                      <div style={{ fontSize: "0.72rem", color: theme.subText }}>{info.label}</div>
                      <div style={{ fontSize: "0.85rem", fontWeight: "600", color: theme.text }}>
                        {info.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reason */}
                <div style={{
                  background: theme.cardBg, borderRadius: "8px",
                  padding: "8px 12px", marginBottom: "12px",
                  fontSize: "0.82rem", color: theme.subText,
                  border: `1px solid ${theme.border}`
                }}>
                  💬 {req.reason}
                </div>

                {/* Approval Trail */}
                {(req.manager_name || req.admin_name) && (
                  <div style={{
                    display: "flex", gap: "8px", marginBottom: "12px",
                    flexWrap: "wrap"
                  }}>
                    {req.manager_name && (
                      <div style={{
                        background: "#6366F110",
                        border: "1px solid #6366F120",
                        borderRadius: "8px", padding: "6px 12px",
                        fontSize: "0.78rem"
                      }}>
                        <span style={{ color: "#6366F1", fontWeight: "600" }}>
                          👨‍💼 {req.manager_name}
                        </span>
                        <span style={{ color: theme.subText }}>
                          {" "}→ {req.manager_action}
                          {req.manager_comment && ` · "${req.manager_comment}"`}
                        </span>
                      </div>
                    )}
                    {req.admin_name && (
                      <div style={{
                        background: "#10B98110",
                        border: "1px solid #10B98120",
                        borderRadius: "8px", padding: "6px 12px",
                        fontSize: "0.78rem"
                      }}>
                        <span style={{ color: "#10B981", fontWeight: "600" }}>
                          👨‍💻 {req.admin_name}
                        </span>
                        <span style={{ color: theme.subText }}>
                          {" "}→ {req.admin_action}
                          {req.po_number && ` · PO: ${req.po_number}`}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "8px" }}>
                  {/* Manager can approve Pending requests */}
                  {user.role === "Manager" && req.status === "Pending" && (
                    <button
                      onClick={() => setActionModal({ req, type: 'manager' })}
                      style={{
                        padding: "8px 16px",
                        background: "linear-gradient(135deg, #6366F1, #06B6D4)",
                        color: "white", border: "none",
                        borderRadius: "8px", cursor: "pointer",
                        fontWeight: "600", fontSize: "0.82rem"
                      }}
                    >
                      👨‍💼 Take Action
                    </button>
                  )}

                  {/* Admin can approve Manager Approved requests */}
                  {user.role === "Admin" && req.status === "Manager Approved" && (
                    <button
                      onClick={() => setActionModal({ req, type: 'admin' })}
                      style={{
                        padding: "8px 16px",
                        background: "linear-gradient(135deg, #10B981, #06B6D4)",
                        color: "white", border: "none",
                        borderRadius: "8px", cursor: "pointer",
                        fontWeight: "600", fontSize: "0.82rem"
                      }}
                    >
                      👨‍💻 Create PO
                    </button>
                  )}

                  {/* PO Number link */}
                  {req.po_number && (
                    <div style={{
                      padding: "8px 16px",
                      background: "#10B98115",
                      color: "#10B981",
                      borderRadius: "8px", fontSize: "0.82rem",
                      fontWeight: "600",
                      border: "1px solid #10B98130"
                    }}>
                      📋 {req.po_number}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RequestList;