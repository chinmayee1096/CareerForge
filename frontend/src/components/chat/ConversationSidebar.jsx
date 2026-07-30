import { useAuth } from "../../context/AuthContext.jsx";
import { MessageSquare, Search } from "lucide-react";
import { useState } from "react";

export default function ConversationSidebar({ conversations, selected, onSelect, onSearch }) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const getOther = (conv) =>
    conv.participants?.find((p) => p._id !== user?._id) || conv.participants?.[0];

  const handleSearch = (value) => {
    setSearch(value);
    onSearch?.(value);
  };

  const getUnread = (conv) => {
    const map = conv.unreadCount;
    if (!map) return 0;
    return map[user?._id] || 0;
  };

  const timeAgo = (date) => {
    if (!date) return "";
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "now";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };

  return (
    <aside className="chat-sidebar">
      <div className="chat-sidebar-head">
        <h2><MessageSquare size={18} /> Messages</h2>
        <div className="chat-search-box">
          <Search size={14} />
          <input
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            id="chat-search-input"
          />
        </div>
      </div>

      <div className="conv-list">
        {conversations.length === 0 && (
          <div className="conv-empty">
            <MessageSquare size={32} style={{ opacity: 0.3 }} />
            <p>No conversations yet</p>
          </div>
        )}
        {conversations.map((conv) => {
          const other = getOther(conv);
          const unread = getUnread(conv);
          const isSelected = selected?._id === conv._id;

          return (
            <button
              key={conv._id}
              className={`conv-item ${isSelected ? "active" : ""}`}
              onClick={() => onSelect(conv)}
              id={`conv-${conv._id}`}
            >
              <div className="conv-avatar">
                {other?.name?.[0]?.toUpperCase() || "?"}
                <span className={`conv-status-dot ${other?.isActive ? "online" : "offline"}`} />
              </div>
              <div className="conv-info">
                <div className="conv-name-row">
                  <span className="conv-name">{other?.name || "Unknown"}</span>
                  <span className="conv-time">{timeAgo(conv.lastMessageAt)}</span>
                </div>
                <div className="conv-preview-row">
                  <span className="conv-preview">
                    {conv.lastMessage?.content?.slice(0, 42) || "Start a conversation"}
                    {conv.lastMessage?.content?.length > 42 ? "…" : ""}
                  </span>
                  {unread > 0 && <span className="conv-unread-badge">{unread}</span>}
                </div>
                <span className="conv-role">{other?.role}</span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
