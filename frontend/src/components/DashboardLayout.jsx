import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Navbar from "./Navbar.jsx";
import Sidebar from "./Sidebar.jsx";
import PrepMateBot from "./PrepMateBot.jsx";

export default function DashboardLayout() {
  const location = useLocation();
  const isInterviewPage = location.pathname === "/interview";
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className={`app-shell${sidebarOpen ? "" : " sidebar-hidden"}`}>
      {/* Floating sidebar toggle button */}
      <button
        className="sidebar-toggle-btn"
        onClick={() => setSidebarOpen((prev) => !prev)}
        aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
      >
        {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
      </button>

      <Sidebar />
      <main className="main-panel">
        <Navbar />
        <section className="page-content"><Outlet /></section>
      </main>
      {!isInterviewPage && <PrepMateBot />}
    </div>
  );
}
