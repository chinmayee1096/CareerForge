import { useAuth } from "../../context/AuthContext.jsx";
import { useSocket } from "../../context/SocketContext.jsx";
import { useEffect, useRef, useState, useCallback } from "react";
import api from "../../api/api.js";
import MessageBubble from "./MessageBubble.jsx";
import { Paperclip, Send, Smile } from "lucide-react";
import { formatTime } from "../../utils/dateUtils.js";

export default function ChatWindow({ conversation }) {
  const { user } = useAuth();
  const { joinConversation, leaveConversation, onMessage, sendTypingStart, sendTypingStop } = useSocket();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const inputRef = useRef(null);

  const otherUser = conversation?.participants?.find((p) => p._id !== user?._id);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchHistory = useCallback(async () => {
    if (!conversation?._id) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/chat/conversations/${conversation._id}/messages`);
      setMessages(data.data || []);
      // Mark as read
      await api.put(`/chat/conversations/${conversation._id}/read`).catch(() => {});
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [conversation?._id]);

  useEffect(() => {
    if (!conversation?._id) return;
    fetchHistory();
    joinConversation(conversation._id);
    inputRef.current?.focus();
    return () => leaveConversation(conversation._id);
  }, [conversation?._id, fetchHistory, joinConversation, leaveConversation]);

  // Subscribe to real-time messages
  useEffect(() => {
    const cleanup = onMessage((msg) => {
      if (msg.conversationId === conversation?._id) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    });
    return cleanup;
  }, [onMessage, conversation?._id]);

  // Typing indicator subscription
  useEffect(() => {
    if (!conversation?._id) return;
    const handler = ({ name }) => {
      setTypingUser(name);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTypingUser(null), 3000);
    };
    const handlerStop = () => setTypingUser(null);
    const socket = useSocket;
    return () => {};
  }, [conversation?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleTyping = (value) => {
    setContent(value);
    if (otherUser?._id) {
      sendTypingStart(conversation._id, otherUser._id);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        sendTypingStop(conversation._id, otherUser._id);
      }, 1500);
    }
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!content.trim() || !conversation?._id || sending) return;
    setSending(true);
    const text = content.trim();
    setContent("");

    // Optimistic update
    const tempMsg = {
      _id: `temp-${Date.now()}`,
      conversationId: conversation._id,
      senderId: { _id: user._id, name: user.name, role: user.role },
      receiverId: otherUser?._id,
      content: text,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const { data } = await api.post("/chat/messages", {
        conversationId: conversation._id,
        content: text,
        receiverId: otherUser?._id
      });
      // Replace temp with real message
      setMessages((prev) => prev.map((m) => m._id === tempMsg._id ? data.data : m));
    } catch {
      // Remove optimistic on error
      setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (messageId) => {
    try {
      await api.delete(`/chat/messages/${messageId}`);
      setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, isDeleted: true } : m));
    } catch {
      // silent
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = new Date(msg.createdAt).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric"
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  if (!conversation) {
    return (
      <div className="chat-window-empty">
        <div className="chat-empty-state">
          <div className="chat-empty-icon">💬</div>
          <h3>Select a conversation</h3>
          <p>Choose a student or mentor to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-window-header">
        <div className="chat-header-avatar">
          {otherUser?.name?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="chat-header-info">
          <strong>{otherUser?.name || "Unknown"}</strong>
          <span className="chat-header-role">{otherUser?.role}</span>
        </div>
        <div className="chat-header-status online-dot-label">
          <span className="online-dot" />
          Active
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages-area" id="chat-messages-scroll">
        {loading && (
          <div className="chat-loading">
            <span className="loader-spin" />
            Loading messages…
          </div>
        )}

        {!loading && Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            <div className="chat-date-divider">
              <span>{date}</span>
            </div>
            {msgs.map((msg) => (
              <MessageBubble
                key={msg._id}
                message={msg}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ))}

        {typingUser && (
          <div className="typing-indicator">
            <span className="typing-dots">
              <span /><span /><span />
            </span>
            <span>{typingUser} is typing…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <form className="chat-input-area" onSubmit={sendMessage} id="chat-input-form">
        <button type="button" className="icon-button chat-attach-btn" title="Attach file" id="chat-attach-btn">
          <Paperclip size={18} />
        </button>
        <textarea
          ref={inputRef}
          className="chat-input"
          placeholder={`Message ${otherUser?.name || ""}…`}
          value={content}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          id="chat-message-input"
        />
        <button
          type="submit"
          className={`chat-send-btn ${sending ? "sending" : ""}`}
          disabled={!content.trim() || sending}
          id="chat-send-btn"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
