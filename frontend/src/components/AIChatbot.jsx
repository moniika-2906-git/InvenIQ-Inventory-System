import { useState, useRef, useEffect } from "react";

function AIChatbot({ theme, inventory, summary }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "👋 Hi! Main InvenIQ AI hoon. Inventory ke baare mein kuch bhi puchho!\n\nExample:\n• Kaunse materials low stock mein hain?\n• Total inventory value kitni hai?\n• Kaunsa supplier best hai?",
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setUnread(0);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = {
      role: "user",
      content: input.trim(),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          history: history
        })
      });

      const data = await res.json();

      const aiMsg = {
        role: "assistant",
        content: data.response,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        error: !data.success
      };

      setMessages(prev => [...prev, aiMsg]);

      if (!isOpen) setUnread(prev => prev + 1);

    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "❌ Connection error. Flask server check karo.",
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        error: true
      }]);
    }

    setLoading(false);
  };

  // Quick suggestions
  const suggestions = [
    "Kaunse materials low stock mein hain?",
    "Total inventory value kitni hai?",
    "Health score kya hai?",
    "Rudrapur plant mein kitne items hain?",
    "Sabse zyada urgent order kaunsa hai?",
  ];

  const formatMessage = (content) => {
    return content.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <>
      {/* Chat Bubble Button */}
      <div style={{
        position: "fixed", bottom: "24px", right: "24px",
        zIndex: 1000
      }}>
        {/* Unread badge */}
        {unread > 0 && !isOpen && (
          <div style={{
            position: "absolute", top: "-6px", right: "-6px",
            background: "#EF4444", color: "white",
            borderRadius: "50%", width: "20px", height: "20px",
            fontSize: "0.7rem", fontWeight: "700",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1001, animation: "pulse 2s infinite"
          }}>
            {unread}
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: "56px", height: "56px", borderRadius: "50%",
            background: isOpen
              ? "#EF4444"
              : "linear-gradient(135deg, #6366F1, #06B6D4)",
            border: "none", cursor: "pointer",
            boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.4rem", transition: "all 0.3s",
            transform: isOpen ? "rotate(45deg)" : "rotate(0deg)"
          }}
        >
          {isOpen ? "✕" : "🤖"}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: "fixed", bottom: "90px", right: "24px",
          width: "380px", height: "520px",
          background: theme.cardBg,
          borderRadius: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          border: `1px solid ${theme.border}`,
          display: "flex", flexDirection: "column",
          zIndex: 999, animation: "slideIn 0.3s ease",
          overflow: "hidden"
        }}>

          {/* Header */}
          <div style={{
            padding: "16px 20px",
            background: "linear-gradient(135deg, #6366F1, #06B6D4)",
            display: "flex", alignItems: "center", gap: "12px"
          }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "1.2rem"
            }}>
              🤖
            </div>
            <div>
              <div style={{ color: "white", fontWeight: "700", fontSize: "0.95rem" }}>
                InvenIQ AI
              </div>
              <div style={{
                color: "rgba(255,255,255,0.8)", fontSize: "0.75rem",
                display: "flex", alignItems: "center", gap: "4px"
              }}>
                <div style={{
                  width: "6px", height: "6px", borderRadius: "50%",
                  background: "#10B981"
                }} />
                Online · Real-time data
              </div>
            </div>
            <button
              onClick={() => setMessages([{
                role: "assistant",
                content: "👋 Chat cleared! Kuch aur puchho.",
                time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
              }])}
              style={{
                marginLeft: "auto", background: "rgba(255,255,255,0.2)",
                border: "none", borderRadius: "8px",
                padding: "4px 10px", cursor: "pointer",
                color: "white", fontSize: "0.75rem"
              }}
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "16px",
            display: "flex", flexDirection: "column", gap: "12px"
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                gap: "8px", alignItems: "flex-end"
              }}>
                {/* AI Avatar */}
                {msg.role === "assistant" && (
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    background: "linear-gradient(135deg, #6366F1, #06B6D4)",
                    display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "0.8rem",
                    flexShrink: 0
                  }}>
                    🤖
                  </div>
                )}

                <div style={{ maxWidth: "80%" }}>
                  <div style={{
                    padding: "10px 14px", borderRadius: msg.role === "user"
                      ? "16px 16px 4px 16px"
                      : "16px 16px 16px 4px",
                    background: msg.role === "user"
                      ? "linear-gradient(135deg, #6366F1, #06B6D4)"
                      : msg.error ? "#EF444415" : theme.bg,
                    color: msg.role === "user" ? "white" : theme.text,
                    fontSize: "0.85rem", lineHeight: 1.5,
                    border: msg.role === "assistant"
                      ? `1px solid ${msg.error ? "#EF444430" : theme.border}`
                      : "none"
                  }}>
                    {formatMessage(msg.content)}
                  </div>
                  <div style={{
                    fontSize: "0.68rem", color: theme.subText,
                    marginTop: "3px",
                    textAlign: msg.role === "user" ? "right" : "left"
                  }}>
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading */}
            {loading && (
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366F1, #06B6D4)",
                  display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "0.8rem"
                }}>
                  🤖
                </div>
                <div style={{
                  padding: "12px 16px", borderRadius: "16px 16px 16px 4px",
                  background: theme.bg, border: `1px solid ${theme.border}`,
                  display: "flex", gap: "4px", alignItems: "center"
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: "6px", height: "6px", borderRadius: "50%",
                      background: "#6366F1",
                      animation: `pulse 1s infinite ${i * 0.2}s`
                    }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {messages.length <= 2 && (
            <div style={{
              padding: "8px 16px",
              display: "flex", gap: "6px",
              overflowX: "auto", flexWrap: "nowrap"
            }}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(s);
                    inputRef.current?.focus();
                  }}
                  style={{
                    padding: "5px 10px", borderRadius: "20px",
                    border: `1px solid ${theme.border}`,
                    background: theme.bg, color: theme.subText,
                    fontSize: "0.72rem", cursor: "pointer",
                    whiteSpace: "nowrap", flexShrink: 0,
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "#6366F115";
                    e.currentTarget.style.color = "#6366F1";
                    e.currentTarget.style.border = "1px solid #6366F130";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = theme.bg;
                    e.currentTarget.style.color = theme.subText;
                    e.currentTarget.style.border = `1px solid ${theme.border}`;
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: "12px 16px",
            borderTop: `1px solid ${theme.border}`,
            display: "flex", gap: "8px", alignItems: "flex-end"
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Kuch bhi puchho... (Enter to send)"
              rows={1}
              style={{
                flex: 1, padding: "10px 14px",
                borderRadius: "12px",
                border: `1.5px solid ${theme.inputBorder}`,
                background: theme.inputBg, color: theme.text,
                fontSize: "0.88rem", outline: "none",
                resize: "none", lineHeight: 1.4,
                maxHeight: "80px", overflowY: "auto",
                fontFamily: "'Inter', sans-serif"
              }}
              onFocus={e => e.target.style.border = "1.5px solid #6366F1"}
              onBlur={e => e.target.style.border = `1.5px solid ${theme.inputBorder}`}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                width: "40px", height: "40px", borderRadius: "12px",
                background: (loading || !input.trim())
                  ? theme.border
                  : "linear-gradient(135deg, #6366F1, #06B6D4)",
                border: "none", cursor: (loading || !input.trim())
                  ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "1rem",
                flexShrink: 0, transition: "all 0.2s"
              }}
            >
              {loading ? "⏳" : "➤"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default AIChatbot;