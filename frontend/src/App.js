import { getToken, removeToken, api } from './utils/api';
import API_URL from './config';
import { useEffect, useState } from "react";
import SummaryCards from "./components/SummaryCards";
import InventoryTable from "./components/InventoryTable";
import TrendChart from "./components/TrendChart";
import Login from "./components/Login";
import Charts from "./components/Charts";
import HealthScore from "./components/HealthScore";
import SupplierChart from "./components/SupplierChart";
import NotificationBell from "./components/NotificationBell";
import AnomalyDetection from "./components/AnomalyDetection";
import PDFReport from "./components/PDFReport";
import ReorderAnalysis from "./components/ReorderAnalysis";
import OrderHistory from "./components/OrderHistory";
import RequestForm from "./components/RequestForm";
import RequestList from "./components/RequestList";
import AIChatbot from "./components/AIChatbot";
import { useBreakpoints } from "./hooks/useMediaQuery";
// Theme System
const getTheme = (dark) => ({
  bg: dark ? "#0F172A" : "#F8FAFC",
  cardBg: dark ? "#1E293B" : "#FFFFFF",
  cardBorder: dark ? "#334155" : "#E2E8F0",
  text: dark ? "#F1F5F9" : "#0F172A",
  subText: dark ? "#94A3B8" : "#64748B",
  border: dark ? "#334155" : "#E2E8F0",
  headerBg: dark ? "#0F172A" : "#FFFFFF",
  sidebarBg: dark ? "#1E293B" : "#FFFFFF",
  inputBg: dark ? "#334155" : "#F8FAFC",
  inputBorder: dark ? "#475569" : "#E2E8F0",
  tagBg: dark ? "#334155" : "#EFF6FF",
  tagText: dark ? "#93C5FD" : "#3B82F6",
  hover: dark ? "#334155" : "#F1F5F9",
  primary: "#6366F1",
  accent: "#06B6D4",
  success: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
});

// Nav Items
const NAV_ITEMS = [
  { id: "dashboard", icon: "▣", label: "Dashboard" },
   { id: "requests", icon: "📬", label: "Stock Requests" },
  { id: "reorder", icon: "↻", label: "Reorder Analysis" },
  { id: "orders", icon: "◫", label: "Order History" },
];

function App() {
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [trend, setTrend] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState("All Materials");
  const [materials, setMaterials] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const { isMobile, isTablet } = useBreakpoints();

  const theme = getTheme(darkMode);

  // Auto-collapse sidebar to icon-only on tablet widths
  useEffect(() => {
    if (isTablet && !isMobile) setSidebarCollapsed(true);
  }, [isTablet, isMobile]);

  // Close the mobile drawer whenever a page is selected or screen grows
  useEffect(() => {
    if (!isMobile) setMobileMenuOpen(false);
  }, [isMobile]);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleRefresh = () => {
  setRefreshing(true);
  Promise.all([
    api.get('/api/summary').then(r => r?.json()),
    api.get('/api/inventory').then(r => r?.json()),
    api.get(selectedMaterial === "All Materials"
      ? '/api/predict'
      : `/api/predict?material=${encodeURIComponent(selectedMaterial)}`
    ).then(r => r?.json())
  ]).then(([s, inv, tr]) => {
    if (s) setSummary(s);
    if (inv) setInventory(inv);
    if (tr) setTrend(tr);
    setLastUpdated(new Date().toLocaleTimeString('en-IN'));
    setRefreshing(false);
  });
};

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(handleRefresh, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);
// Summary + Inventory
useEffect(() => {
  if (!user) return;
  api.get('/api/summary').then(r => r?.json()).then(d => {
    if (d) {
      setSummary(d);
      setLastUpdated(new Date().toLocaleTimeString('en-IN'));
    }
  });
  api.get('/api/inventory').then(r => r?.json()).then(d => {
    if (d) {
      setInventory(d);
      setMaterials(["All Materials", ...new Set(d.map(i => i.Description))]);
    }
  });
}, [user]);

// Predict
useEffect(() => {
  if (!user) return;
  const url = selectedMaterial === "All Materials"
    ? '/api/predict'
    : `/api/predict?material=${encodeURIComponent(selectedMaterial)}`;
  api.get(url).then(r => r?.json()).then(d => {
    if (d) setTrend(d);
  });
}, [selectedMaterial, user]);

  if (!user) return <Login onLogin={setUser} theme={theme} />;

  const lowStockCount = summary?.low_stock_count || 0;

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: theme.bg, fontFamily: "'Inter', sans-serif",
      transition: "all 0.3s ease"
    }}>

      {/* ── Mobile Backdrop ── */}
      {isMobile && mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 99
          }}
        />
      )}

      {/* ── Sidebar ── */}
      <div style={{
        width: isMobile ? "240px" : (sidebarCollapsed ? "72px" : "240px"),
        background: theme.sidebarBg,
        borderRight: `1px solid ${theme.border}`,
        display: "flex", flexDirection: "column",
        transition: "width 0.3s ease, transform 0.3s ease",
        position: "fixed", top: 0, left: 0,
        height: "100vh", zIndex: 100,
        overflow: "hidden",
        transform: isMobile && !mobileMenuOpen ? "translateX(-100%)" : "translateX(0)"
      }}>
        {/* Logo */}
        <div style={{
          padding: "20px 16px",
          borderBottom: `1px solid ${theme.border}`,
          display: "flex", alignItems: "center", gap: "12px"
        }}>
          <div style={{
            width: "36px", height: "36px", flexShrink: 0,
            background: "linear-gradient(135deg, #6366F1, #06B6D4)",
            borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px", fontWeight: "800", color: "white"
          }}>
            I
          </div>
          {(!sidebarCollapsed || isMobile) && (
            <div>
              <div style={{ fontWeight: "700", fontSize: "1rem", color: theme.text }}>
                InvenIQ
              </div>
              <div style={{ fontSize: "0.7rem", color: theme.subText }}>
                Inventory Intelligence
              </div>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav style={{ padding: "12px 8px", flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  if (isMobile) setMobileMenuOpen(false);
                }}
                style={{
                  width: "100%", display: "flex", alignItems: "center",
                  gap: "12px", padding: "10px 12px",
                  borderRadius: "10px", border: "none",
                  background: active
                    ? "linear-gradient(135deg, #6366F120, #06B6D420)"
                    : "transparent",
                  color: active ? theme.primary : theme.subText,
                  cursor: "pointer", marginBottom: "4px",
                  transition: "all 0.2s",
                  borderLeft: active ? `3px solid ${theme.primary}` : "3px solid transparent",
                  textAlign: "left", whiteSpace: "nowrap"
                }}
                onMouseEnter={e => {
                  if (!active) e.currentTarget.style.background = theme.hover;
                }}
                onMouseLeave={e => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{item.icon}</span>
                {(!sidebarCollapsed || isMobile) && (
                  <span style={{ fontSize: "0.9rem", fontWeight: active ? "600" : "400" }}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Info */}
        {(!sidebarCollapsed || isMobile) && (
          <div style={{
            padding: "16px",
            borderTop: `1px solid ${theme.border}`,
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "10px", borderRadius: "10px",
              background: theme.inputBg
            }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                background: `linear-gradient(135deg, ${user.color}, #06B6D4)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontWeight: "700", fontSize: "0.85rem", flexShrink: 0
              }}>
                {user.name[0]}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontWeight: "600", fontSize: "0.85rem", color: theme.text }}>
                  {user.name}
                </div>
                <div style={{ fontSize: "0.75rem", color: theme.subText }}>
                  {user.role}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Area ── */}
      <div style={{
        marginLeft: isMobile ? "0" : (sidebarCollapsed ? "72px" : "240px"),
        flex: 1, transition: "margin-left 0.3s ease",
        display: "flex", flexDirection: "column",
        minWidth: 0, width: "100%"
      }}>

        {/* ── Topbar ── */}
        <div style={{
          background: theme.headerBg,
          borderBottom: `1px solid ${theme.border}`,
          padding: "12px clamp(12px, 4vw, 24px)",
          display: "flex", justifyContent: "space-between",
          alignItems: "center", gap: "12px",
          position: "sticky", top: 0, zIndex: 50,
          backdropFilter: "blur(10px)",
          flexWrap: "wrap"
        }}>
          {/* Left */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Collapse / Hamburger button */}
            <button
              onClick={() => isMobile ? setMobileMenuOpen(!mobileMenuOpen) : setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                background: theme.inputBg, border: `1px solid ${theme.border}`,
                borderRadius: "8px", padding: "6px 10px",
                cursor: "pointer", color: theme.subText, fontSize: "1rem"
              }}
            >
              ☰
            </button>

            {/* Page Title */}
            <div>
              <h1 style={{
                fontSize: "clamp(0.95rem, 3vw, 1.1rem)", fontWeight: "700",
                color: theme.text, margin: 0
              }}>
                {NAV_ITEMS.find(n => n.id === activePage)?.label}
              </h1>
              <div style={{ fontSize: "0.75rem", color: theme.subText, display: isMobile ? "none" : "block" }}>
                {time.toLocaleString('en-IN', { 
                  weekday: 'short', day: '2-digit', 
                  month: 'short', hour: '2-digit', minute: '2-digit' 
                })}
                {lastUpdated && ` · Updated ${lastUpdated}`}
              </div>
            </div>
          </div>

          {/* Right — Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>

            {/* Notification */}
            <NotificationBell inventory={inventory} theme={theme} />

            {/* Refresh */}
            <button onClick={handleRefresh} disabled={refreshing} style={{
              background: theme.inputBg, border: `1px solid ${theme.border}`,
              borderRadius: "8px", padding: "8px 12px",
              cursor: "pointer", color: theme.subText,
              display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem"
            }}>
              <span style={{ animation: refreshing ? "spin 1s linear infinite" : "none", display: "inline-block" }}>
                ↻
              </span>
              {!isMobile && (!refreshing ? "Refresh" : "...")}
            </button>

            {/* Dark Mode */}
            <button onClick={() => setDarkMode(!darkMode)} style={{
              background: theme.inputBg, border: `1px solid ${theme.border}`,
              borderRadius: "8px", padding: "8px 12px",
              cursor: "pointer", color: theme.subText, fontSize: "0.85rem"
            }}>
              {darkMode ? (isMobile ? "☀️" : "☀️ Light") : (isMobile ? "🌙" : "🌙 Dark")}
            </button>

            {/* Export Excel */}
{user.role !== "Viewer" && (
  <button
    onClick={() => {
      const token = getToken();
      const link = document.createElement('a');
      link.href = `${API_URL}/api/export`;
      fetch(`${API_URL}/api/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'roquette_inventory_report.xlsx';
          a.click();
          window.URL.revokeObjectURL(url);
        });
    }}
    style={{
      background: "#10B981", color: "white",
      border: "none", borderRadius: "8px",
      padding: "8px 14px", cursor: "pointer",
      fontWeight: "600", fontSize: "0.85rem",
      display: "flex", alignItems: "center", gap: "6px"
    }}
  >
    ↓{!isMobile && " Excel"}
  </button>
)}

{/* Simulate Day — Admin Only */}
{user.role === "Admin" && (
  <button
    onClick={async () => {
      const res = await api.post('/api/simulate-day', {});
      const data = await res?.json();
      if (data?.success) {
        handleRefresh();
        alert(`✅ Day simulated!\nChanges: ${data.changes} materials updated`);
      }
    }}
    style={{
      background: "linear-gradient(135deg, #6366F1, #06B6D4)",
      color: "white", border: "none",
      borderRadius: "8px", padding: "8px 14px",
      cursor: "pointer", fontWeight: "600",
      fontSize: "0.85rem"
    }}
  >
    ⏭{!isMobile && " Next Day"}
  </button>
)}
            {/* Logout */}
            <button onClick={() => {
              setUser(null); setSummary(null);
              setInventory(null); setTrend(null);
            }} style={{
              background: theme.inputBg, border: `1px solid ${theme.border}`,
              borderRadius: "8px", padding: "8px 12px",
              cursor: "pointer", color: theme.danger,
              fontWeight: "600", fontSize: "0.85rem"
            }}>
              ⏻
            </button>
          </div>
        </div>

        {/* ── Page Content ── */}
        <div style={{ padding: "clamp(12px, 3vw, 24px)", flex: 1, minWidth: 0 }} className="fade-in">

          {activePage === "dashboard" && (
            <>
              <SummaryCards summary={summary} theme={theme} />
              <Charts summary={summary} theme={theme} />
              <HealthScore summary={summary} theme={theme} />
              <SupplierChart data={inventory} theme={theme} />
              <AnomalyDetection theme={theme} />

              {/* ML Section */}
              <div style={{
                background: theme.cardBg,
                borderRadius: "16px",
                padding: "20px 24px",
                marginBottom: "20px",
                border: `1px solid ${theme.border}`,
                display: "flex", alignItems: "center",
                gap: "16px", flexWrap: "wrap"
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  fontWeight: "600", color: theme.text, fontSize: "0.9rem"
                }}>
                  <span style={{
                    background: "linear-gradient(135deg, #6366F1, #06B6D4)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontWeight: "700"
                  }}>
                    ◈ ML Forecast
                  </span>
                </div>

                <select
                  value={selectedMaterial}
                  onChange={e => setSelectedMaterial(e.target.value)}
                  style={{
                    padding: "8px 16px", borderRadius: "10px",
                    border: `1px solid ${theme.inputBorder}`,
                    fontSize: "0.9rem", minWidth: "min(250px, 100%)",
                    width: isMobile ? "100%" : "auto",
                    background: theme.inputBg, color: theme.text,
                    outline: "none", cursor: "pointer"
                  }}
                >
                  {materials.map(m => <option key={m}>{m}</option>)}
                </select>

                {trend && (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {[
                      { label: "Avg Stock", value: trend.avg_stock, color: "#6366F1" },
                      { label: "Trend", value: trend.trend_direction, color: "#06B6D4" },
                      { label: "Accuracy", value: `${trend.model_accuracy}%`, color: trend.model_accuracy > 70 ? "#10B981" : "#F59E0B" },
                    ].map((tag, i) => (
                      <div key={i} style={{
                        background: tag.color + "15",
                        border: `1px solid ${tag.color}30`,
                        borderRadius: "8px", padding: "4px 12px",
                        fontSize: "0.82rem"
                      }}>
                        <span style={{ color: theme.subText }}>{tag.label}: </span>
                        <span style={{ color: tag.color, fontWeight: "600" }}>{tag.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <TrendChart data={trend} theme={theme} />
              <InventoryTable data={inventory} theme={theme} />
            </>
          )}

          {activePage === "reorder" && (
            <ReorderAnalysis theme={theme} user={user} />
          )}

          {activePage === "orders" && (
            <OrderHistory theme={theme} user={user} />
          )}
          {activePage === "requests" && (
  <div>
    <div style={{ marginBottom: "24px" }}>
      <h2 style={{ margin: "0 0 4px", color: theme.text, fontWeight: "800" }}>
        Stock Request Workflow
      </h2>
      <p style={{ color: theme.subText, fontSize: "0.85rem", margin: 0 }}>
        {user.role === "Viewer" 
          ? "Submit stock requests for manager approval"
          : user.role === "Manager"
          ? "Review and approve staff requests"
          : "Final approval and purchase order generation"
        }
      </p>
    </div>

    {/* Staff — Request Form dikhao */}
    {user.role === "Viewer" && (
      <RequestForm
        inventory={inventory}
        user={user}
        theme={theme}
        onSuccess={(reqNo) => {
         
        }}
      />
    )}

    {/* Manager + Admin — Request List dikhao */}
    {(user.role === "Manager" || user.role === "Admin") && (
      <>
        {/* Admin can also create requests */}
        {user.role === "Admin" && (
          <details style={{ marginBottom: "20px" }}>
            <summary style={{
              cursor: "pointer", padding: "12px 16px",
              background: theme.cardBg, borderRadius: "10px",
              border: `1px solid ${theme.border}`,
              color: theme.text, fontWeight: "600",
              fontSize: "0.9rem", listStyle: "none"
            }}>
              ➕ Create New Request (Admin)
            </summary>
            <div style={{ marginTop: "12px" }}>
              <RequestForm
                inventory={inventory}
                user={user}
                theme={theme}
                onSuccess={(reqNo) => {
                  alert(`✅ Request ${reqNo} created!`);
                }}
              />
            </div>
          </details>
        )}
        <RequestList user={user} theme={theme} />
      </>
    )}
  </div>
)}
        </div>
      </div>
      {/* AI Chatbot */}
      <AIChatbot
        theme={theme}
        inventory={inventory}
        summary={summary}
      />
    </div>
  );
}

export default App;