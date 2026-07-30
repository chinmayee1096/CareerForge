import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import api from "../api/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function PrepMateBot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi ${user?.name || "there"}! 👋 I'm **PrepMate**, your friendly AI placement preparation buddy. Ask me anything about coding, resumes, interviews, or how to prepare! 🚀`
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  // Only render for students
  if (!user || user.role !== "student") return null;

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add user message to state
    const updatedMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Send chat history (excluding the first welcome message to keep context clean)
      const history = updatedMessages
        .slice(1)
        .map(({ role, content }) => ({ role, content }));

      const { data } = await api.post("/prepmate/chat", {
        message: userMessage,
        history
      });

      if (data.success) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      } else {
        throw new Error();
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Oops! I ran into a small issue. Please try asking again. I'm right here!"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prepmate-bot-container" style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 1000 }}>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          className="prepmate-float-btn"
          onClick={() => setIsOpen(true)}
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #0f766e, #0d9488)",
            color: "white",
            border: "0",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            boxShadow: "0 10px 25px rgba(13, 148, 136, 0.35)",
            transition: "all 0.2s ease",
            position: "relative"
          }}
          title="Ask PrepMate"
        >
          <Bot size={28} className="pulse-icon" />
          <span 
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              width: "12px",
              height: "12px",
              background: "#22c55e",
              borderRadius: "50%",
              border: "2px solid white"
            }}
          />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="prepmate-chat-window"
          style={{
            width: "380px",
            height: "500px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
          {/* Header */}
          <div
            className="prepmate-chat-header"
            style={{
              background: "linear-gradient(135deg, #0f766e, #0d9488)",
              color: "white",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div 
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  display: "grid",
                  placeItems: "center"
                }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "15px" }}>PrepMate AI</strong>
                <span style={{ fontSize: "11px", opacity: 0.85, display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "6px", height: "6px", background: "#4ade80", borderRadius: "50%" }} />
                  Your prep buddy is online
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "transparent",
                border: "0",
                color: "white",
                cursor: "pointer",
                padding: "4px"
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div
            className="prepmate-chat-messages"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              background: "var(--surface-soft)",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}
          >
            {messages.map((msg, index) => {
              const isAssistant = msg.role === "assistant";
              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: isAssistant ? "flex-start" : "flex-end",
                    width: "100%"
                  }}
                >
                  <div
                    style={{
                      maxWidth: "85%",
                      padding: "10px 14px",
                      borderRadius: "14px",
                      borderBottomLeftRadius: isAssistant ? "2px" : "14px",
                      borderBottomRightRadius: isAssistant ? "14px" : "2px",
                      background: isAssistant ? "var(--surface)" : "#0f766e",
                      color: isAssistant ? "var(--text)" : "white",
                      border: isAssistant ? "1px solid var(--border)" : "0",
                      fontSize: "13.5px",
                      lineHeight: "1.5",
                      whiteSpace: "pre-wrap",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.03)"
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}
            
            {/* Loading Indicator */}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start", width: "100%" }}>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "14px",
                    borderBottomLeftRadius: "2px",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    gap: "4px",
                    alignItems: "center"
                  }}
                >
                  <span className="dot-blink" style={{ width: "6px", height: "6px", background: "var(--muted)", borderRadius: "50%" }} />
                  <span className="dot-blink" style={{ width: "6px", height: "6px", background: "var(--muted)", borderRadius: "50%", animationDelay: "0.2s" }} />
                  <span className="dot-blink" style={{ width: "6px", height: "6px", background: "var(--muted)", borderRadius: "50%", animationDelay: "0.4s" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={sendMessage}
            style={{
              padding: "12px",
              background: "var(--surface)",
              borderTop: "1px solid var(--border)",
              display: "flex",
              gap: "8px"
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your prep..."
              style={{
                flex: 1,
                border: "1px solid var(--border)",
                borderRadius: "20px",
                padding: "8px 14px",
                fontSize: "13.5px",
                outline: "none",
                background: "var(--surface-soft)",
                color: "var(--text)"
              }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#0f766e",
                color: "white",
                border: "0",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                opacity: input.trim() && !loading ? 1 : 0.6,
                transition: "opacity 0.2s"
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
