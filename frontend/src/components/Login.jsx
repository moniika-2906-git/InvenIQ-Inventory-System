import { useState } from "react";
import API_URL from "../config";
import { setToken } from "../utils/api";
import { useMediaQuery } from "../hooks/useMediaQuery";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const isMobile = useMediaQuery("(max-width: 860px)");

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Username aur password dono zaroori hain");
      return;
    }

    if (attempts >= 5) {
      setError("Bahut zyada attempts! Thodi der baad try karo.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (data.success) {
        setToken(data.token);
        onLogin(data.user);
      } else {
        setAttempts(prev => prev + 1);
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Server se connect nahi ho pa raha. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0F172A",
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Left Panel — hidden on mobile to keep the login form front and center */}
      {!isMobile && (
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        justifyContent: "center", padding: "60px",
        background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
        position: "relative", overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", top: "-100px", left: "-100px",
          width: "400px", height: "400px", borderRadius: "50%",
          background: "radial-gradient(circle, #6366F130, transparent)",
          filter: "blur(40px)"
        }} />
        <div style={{
          position: "absolute", bottom: "-50px", right: "-50px",
          width: "300px", height: "300px", borderRadius: "50%",
          background: "radial-gradient(circle, #06B6D430, transparent)",
          filter: "blur(40px)"
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "14px", marginBottom: "48px"
          }}>
            <div style={{
              width: "48px", height: "48px",
              background: "linear-gradient(135deg, #6366F1, #06B6D4)",
              borderRadius: "14px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "24px", fontWeight: "800", color: "white",
              boxShadow: "0 8px 24px #6366F140"
            }}>I</div>
            <div>
              <div style={{ fontWeight: "800", fontSize: "1.4rem", color: "white" }}>InvenIQ</div>
              <div style={{ fontSize: "0.8rem", color: "#64748B" }}>Inventory Intelligence System</div>
            </div>
          </div>

          <h1 style={{
            fontSize: "2.8rem", fontWeight: "800",
            color: "white", lineHeight: 1.2, marginBottom: "16px"
          }}>
            Smarter Inventory,<br />
            <span style={{
              background: "linear-gradient(135deg, #6366F1, #06B6D4)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>
              Better Decisions
            </span>
          </h1>

          <p style={{
            color: "#64748B", fontSize: "1rem",
            lineHeight: 1.6, maxWidth: "400px", marginBottom: "48px"
          }}>
            AI-powered inventory management with real-time analytics,
            ML forecasting, and automated purchase orders.
          </p>

          {[
            { icon: "◈", text: "Real-time stock monitoring" },
            { icon: "◎", text: "ML-based stockout prediction" },
            { icon: "◫", text: "Automated purchase orders" },
            { icon: "🤖", text: "AI chatbot assistance" },
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div style={{
                width: "32px", height: "32px", background: "#6366F120",
                border: "1px solid #6366F130", borderRadius: "8px",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#6366F1", fontSize: "0.9rem"
              }}>{f.icon}</div>
              <span style={{ color: "#94A3B8", fontSize: "0.9rem" }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Right Panel */}
      <div style={{
        width: isMobile ? "100%" : "480px", display: "flex", alignItems: "center",
        justifyContent: "center", padding: isMobile ? "32px 20px" : "40px", background: "#FFFFFF",
        minHeight: isMobile ? "100vh" : "auto"
      }}>
        <div style={{ width: "100%", maxWidth: "380px" }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0F172A", marginBottom: "8px" }}>
            Welcome back
          </h2>
          <p style={{ color: "#64748B", fontSize: "0.9rem", marginBottom: "32px" }}>
            Sign in to access InvenIQ dashboard
          </p>

          {/* Attempts Warning */}
          {attempts >= 3 && (
            <div style={{
              background: "#FFF7ED", border: "1px solid #FED7AA",
              borderRadius: "8px", padding: "10px 14px",
              color: "#C2410C", fontSize: "0.82rem", marginBottom: "16px"
            }}>
              ⚠️ {5 - attempts} attempts remaining
            </div>
          )}

          {/* Username */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{
              display: "block", fontSize: "0.85rem",
              fontWeight: "600", color: "#374151", marginBottom: "6px"
            }}>Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleLogin()}
              autoComplete="username"
              style={{
                width: "100%", padding: "12px 16px", borderRadius: "10px",
                border: `2px solid ${error ? "#EF4444" : "#E2E8F0"}`,
                fontSize: "16px", outline: "none",
                boxSizing: "border-box", color: "#0F172A", background: "#F8FAFC"
              }}
              onFocus={e => e.target.style.border = "2px solid #6366F1"}
              onBlur={e => e.target.style.border = `2px solid ${error ? "#EF4444" : "#E2E8F0"}`}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{
              display: "block", fontSize: "0.85rem",
              fontWeight: "600", color: "#374151", marginBottom: "6px"
            }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleLogin()}
                autoComplete="current-password"
                style={{
                  width: "100%", padding: "12px 44px 12px 16px",
                  borderRadius: "10px",
                  border: `2px solid ${error ? "#EF4444" : "#E2E8F0"}`,
                  fontSize: "16px", outline: "none",
                  boxSizing: "border-box", color: "#0F172A", background: "#F8FAFC"
                }}
                onFocus={e => e.target.style.border = "2px solid #6366F1"}
                onBlur={e => e.target.style.border = `2px solid ${error ? "#EF4444" : "#E2E8F0"}`}
              />
              <button
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute", right: "12px", top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none",
                  cursor: "pointer", color: "#94A3B8", fontSize: "0.85rem"
                }}
              >{showPass ? "Hide" : "Show"}</button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA",
              borderRadius: "8px", padding: "10px 14px",
              color: "#EF4444", fontSize: "0.85rem", marginBottom: "16px"
            }}>⚠ {error}</div>
          )}

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={loading || attempts >= 5}
            style={{
              width: "100%", padding: "13px",
              background: (loading || attempts >= 5)
                ? "#E2E8F0"
                : "linear-gradient(135deg, #6366F1, #06B6D4)",
              color: (loading || attempts >= 5) ? "#94A3B8" : "white",
              border: "none", borderRadius: "10px",
              fontSize: "0.95rem", fontWeight: "700",
              cursor: (loading || attempts >= 5) ? "not-allowed" : "pointer",
              boxShadow: (loading || attempts >= 5) ? "none" : "0 4px 14px #6366F140",
              transition: "all 0.2s", marginBottom: "24px"
            }}
          >
            {loading ? "Signing in..." : "Sign In →"}
          </button>

          {/* Security Badge */}
          <div style={{
            background: "#F0FDF4", borderRadius: "10px",
            padding: "12px 16px", border: "1px solid #BBF7D0"
          }}>
            <div style={{
              fontSize: "0.78rem", color: "#15803D",
              display: "flex", alignItems: "center", gap: "6px"
            }}>
              🔒 Secured with JWT Authentication
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;