import {
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  ClipboardList,
  Code2,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  ScanSearch,
  User,
  Users
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";

const links = {
  student: [
    { to: "/student", label: "Dashboard", icon: LayoutDashboard },
    { to: "/tasks", label: "Tasks", icon: ClipboardList },
    { to: "/interview", label: "Interview", icon: GraduationCap },
    { to: "/ats", label: "ATS Lab", icon: ScanSearch },
    { to: "/coding", label: "Coding", icon: Code2 },
    { to: "/applications", label: "Applications", icon: BriefcaseBusiness },
    { to: "/guide", label: "Guide", icon: BookOpenCheck },
    { to: "/chat", label: "Messages", icon: MessageSquare },
    { to: "/profile", label: "Profile", icon: User },
    { to: "/reports", label: "Reports", icon: FileText }
  ],
  mentor: [
    { to: "/mentor", label: "Dashboard", icon: Users },
    { to: "/tasks", label: "Tasks", icon: ClipboardList },
    { to: "/chat", label: "Messages", icon: MessageSquare },
    { to: "/profile", label: "Profile", icon: User },
    { to: "/reports", label: "Reports", icon: FileText }
  ],
  admin: [
    { to: "/admin", label: "Overview", icon: BarChart3 },
    { to: "/reports", label: "Reports", icon: FileText }
  ]
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useSocket() || {};

  return (
    <aside className="sidebar">
      <div className="brand" style={{ display: "flex", alignItems: "center", gap: "10px", paddingBottom: "10px" }}>
        <img
          src="/logo.png"
          alt="CareerForge Logo"
          className="sidebar-logo-img"
          style={{ width: "32px", height: "32px", borderRadius: "6px", objectFit: "contain" }}
        />
        <span style={{ fontWeight: "800", fontSize: "20px", color: "white" }}>CareerForge</span>
      </div>
      <nav>
        {(links[user?.role] || []).map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <Icon size={18} />
            <span>{label}</span>
            {to === "/chat" && unreadCount > 0 && (
              <span className="sidebar-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar" style={{ overflow: "hidden" }}>
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt="Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              user?.name?.[0]?.toUpperCase()
            )}
          </div>
          <div>
            <div className="sidebar-name">{user?.name}</div>
            <div className="sidebar-role">{user?.role}</div>
          </div>
        </div>
        <button className="ghost-button" onClick={logout} id="logout-btn">
          <LogOut size={17} /> Logout
        </button>
      </div>
    </aside>
  );
}
