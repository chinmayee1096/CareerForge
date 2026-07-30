import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import { Bell, Check, CheckCheck, Moon, Search, Sun, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import api from "../api/api.js";

export default function Navbar() {
  const { user } = useAuth();
  const { unreadCount, notifications: socketNotifications, clearNotificationCount } = useSocket();
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Combine real-time socket notifications with persisted ones
  useEffect(() => {
    setTotalUnread((prev) => prev + unreadCount);
  }, [unreadCount]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/notifications?limit=20");
      setNotifications(data.data || []);
      setTotalUnread(data.meta?.unreadCount || 0);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  const openPanel = () => {
    setShowNotifications(true);
    clearNotificationCount();
    fetchNotifications();
  };

  const markAllRead = async () => {
    try {
      await api.put("/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "read" })));
      setTotalUnread(0);
    } catch {
      // silent
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {
      // silent
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const notifTypeIcon = (type) => {
    switch (type) {
      case "message": return "💬";
      case "interview": return "🎯";
      case "feedback": return "📊";
      case "task": return "✅";
      case "progress": return "📈";
      case "report": return "📄";
      default: return "🔔";
    }
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <header className="navbar">
      <div className="search-box">
        <Search size={17} />
        <input placeholder="Search tasks, topics, interviews…" id="navbar-search" />
      </div>
      <div className="nav-user">
        <button
          className="icon-button"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          aria-label="Toggle theme"
          id="theme-toggle-btn"
        >
          {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
        </button>

        {/* Notification Bell */}
        <div className="notif-wrapper" ref={panelRef}>
          <button
            className="icon-button notif-bell"
            onClick={openPanel}
            id="notification-bell-btn"
            aria-label={`${totalUnread} unread notifications`}
          >
            <Bell size={18} />
            {totalUnread > 0 && (
              <span className="notif-badge">{totalUnread > 99 ? "99+" : totalUnread}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notif-panel" role="dialog" aria-label="Notifications panel">
              <div className="notif-panel-head">
                <strong>Notifications</strong>
                <div className="button-row">
                  {totalUnread > 0 && (
                    <button className="icon-button" onClick={markAllRead} title="Mark all read" id="mark-all-read-btn">
                      <CheckCheck size={15} />
                    </button>
                  )}
                  <button className="icon-button" onClick={() => setShowNotifications(false)} id="close-notif-btn">
                    <X size={15} />
                  </button>
                </div>
              </div>

              <div className="notif-list">
                {loading && <div className="notif-empty">Loading…</div>}
                {!loading && notifications.length === 0 && (
                  <div className="notif-empty">
                    <Bell size={24} style={{ opacity: 0.4 }} />
                    <span>No notifications yet</span>
                  </div>
                )}
                {notifications.map((n) => (
                  <div
                    key={n._id}
                    className={`notif-item ${n.status === "unread" ? "unread" : ""}`}
                    id={`notif-${n._id}`}
                  >
                    <span className="notif-icon">{notifTypeIcon(n.type)}</span>
                    <div className="notif-body">
                      <div className="notif-title">{n.title}</div>
                      <div className="notif-msg">{n.message}</div>
                      <div className="notif-time">{timeAgo(n.createdAt)}</div>
                    </div>
                    <div className="notif-actions">
                      {n.status === "unread" && (
                        <button
                          className="icon-button"
                          title="Mark read"
                          onClick={async () => {
                            await api.put(`/notifications/${n._id}/read`);
                            setNotifications((prev) =>
                              prev.map((x) => x._id === n._id ? { ...x, status: "read" } : x)
                            );
                            setTotalUnread((prev) => Math.max(0, prev - 1));
                          }}
                        >
                          <Check size={13} />
                        </button>
                      )}
                      <button
                        className="icon-button"
                        title="Delete"
                        onClick={() => deleteNotification(n._id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="nav-user-info">
          <span className="nav-name">{user?.name}</span>
          <strong className="nav-role">{user?.role}</strong>
        </div>
      </div>
    </header>
  );
}
