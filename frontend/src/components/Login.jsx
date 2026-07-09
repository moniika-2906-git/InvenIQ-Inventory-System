import { useState } from "react";

const USERS = {
  "admin": { password: "admin123", role: "Admin", name: "IT Admin", color: "#6366F1" },
  "manager": { password: "manager123", role: "Manager", name: "Plant Manager", color: "#10B981" },
  "viewer": { password: "viewer123", role: "Viewer", name: "Staff", color: "#F59E0B" }
};

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = () => {
    if (!username || !password) {
      setError("Username aur password dono zaroori hain");
      return;
    }
    setLoading(true);
    setError("");
    setTimeout(() => {
      const user = USERS[username.toLowerCase()];
      if (user && user.password === password) {
        onLogin({ username, ...user });
      } else {
        setError("Invalid username or password");
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0F172A",
      display: "flex",
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Left Panel */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        justifyContent: "center", padding: "60px",
        background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
        position: "relative", overflow: "hidden"
      }}>
        {/* Background decoration */}
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

        {/* Logo */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "14px",
            marginBottom: "48px"
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
              <div style={{ fontWeight: "800", fontSize: "1.4rem", color: "white" }}>
                InvenIQ
              </div>
              <div style={{ fontSize: "0.8rem", color: "#64748B" }}>
                Inventory Intelligence System
              </div>
            </div>
          </div>

          <h1 style={{
            fontSize: "2.8rem", fontWeight: "800",
            color: "white", lineHeight: 1.2, marginBottom: "16px"
          }}>
            Smarter Inventory,<br />
            <span style={{
              background: "linear-gradient(135deg, #6366F1, #06B6D4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
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

          {/* Feature Pills */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { icon: "◈", text: "Real-time stock monitoring" },
              { icon: "◎", text: "ML-based stockout prediction" },
              { icon: "◫", text: "Automated purchase orders" },
            ].map((f, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "12px"
              }}>
                <div style={{
                  width: "32px", height: "32px",
                  background: "#6366F120",
                  border: "1px solid #6366F130",
                  borderRadius: "8px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#6366F1", fontSize: "0.9rem"
                }}>
                  {f.icon}
                </div>
                <span style={{ color: "#94A3B8", fontSize: "0.9rem" }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div style={{
        width: "480px", display: "flex", alignItems: "center",
        justifyContent: "center", padding: "40px",
        background: "#FFFFFF"
      }}>
        <div style={{ width: "100%", maxWidth: "380px" }}>
          <h2 style={{
            fontSize: "1.6rem", fontWeight: "800",
            color: "#0F172A", marginBottom: "8px"
          }}>
            Welcome back
          </h2>
          <p style={{ color: "#64748B", fontSize: "0.9rem", marginBottom: "32px" }}>
            Sign in to your account to continue
          </p>

          {/* Username */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{
              display: "block", fontSize: "0.85rem",
              fontWeight: "600", color: "#374151", marginBottom: "6px"
            }}>
              Username
            </label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleLogin()}
              style={{
                width: "100%", padding: "12px 16px",
                borderRadius: "10px",
                border: `2px solid ${error ? "#EF4444" : "#E2E8F0"}`,
                fontSize: "0.95rem", outline: "none",
                boxSizing: "border-box", transition: "border 0.2s",
                color: "#0F172A", background: "#F8FAFC"
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
            }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleLogin()}
                style={{
                  width: "100%", padding: "12px 44px 12px 16px",
                  borderRadius: "10px",
                  border: `2px solid ${error ? "#EF4444" : "#E2E8F0"}`,
                  fontSize: "0.95rem", outline: "none",
                  boxSizing: "border-box", transition: "border 0.2s",
                  color: "#0F172A", background: "#F8FAFC"
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
              >
                {showPass ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA",
              borderRadius: "8px", padding: "10px 14px",
              color: "#EF4444", fontSize: "0.85rem", marginBottom: "16px"
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%", padding: "13px",
              background: loading
                ? "#E2E8F0"
                : "linear-gradient(135deg, #6366F1, #06B6D4)",
              color: loading ? "#94A3B8" : "white",
              border: "none", borderRadius: "10px",
              fontSize: "0.95rem", fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 14px #6366F140",
              transition: "all 0.2s", marginBottom: "24px"
            }}
          >
            {loading ? "Signing in..." : "Sign In →"}
          </button>

          {/* Demo Credentials */}
          <div style={{
            background: "#F8FAFC", borderRadius: "10px",
            padding: "16px", border: "1px solid #E2E8F0"
          }}>
            <div style={{
              fontSize: "0.78rem", fontWeight: "600",
              color: "#64748B", marginBottom: "10px",
              textTransform: "uppercase", letterSpacing: "0.05em"
            }}>
              Demo Credentials
            </div>
            {[
              { role: "Admin", user: "admin", pass: "admin123", color: "#6366F1" },
              { role: "Manager", user: "manager", pass: "manager123", color: "#10B981" },
              { role: "Viewer", user: "viewer", pass: "viewer123", color: "#F59E0B" },
            ].map((c, i) => (
              <div
                key={i}
                onClick={() => { setUsername(c.user); setPassword(c.pass); }}
                style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px", borderRadius: "8px",
                  cursor: "pointer", marginBottom: "4px",
                  transition: "background 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#F1F5F9"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    width: "24px", height: "24px", borderRadius: "6px",
                    background: c.color + "20",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.7rem", fontWeight: "700", color: c.color
                  }}>
                    {c.role[0]}
                  </div>
                  <span style={{ fontSize: "0.82rem", color: "#374151", fontWeight: "500" }}>
                    {c.role}
                  </span>
                </div>
                <span style={{ fontSize: "0.78rem", color: "#94A3B8" }}>
                  Click to fill
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;