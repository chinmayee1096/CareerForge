import { Link } from "react-router-dom";
import { BrainCircuit } from "lucide-react";

export default function WelcomeNavbar() {
  return (
    <header className="welcome-navbar">
      <Link className="welcome-brand" to="/" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <img src="/logo.png" alt="CareerForge Logo" style={{ width: "32px", height: "32px", borderRadius: "6px", objectFit: "contain", filter: "var(--logo-filter)" }} />
        <span>CareerForge</span>
      </Link>
    </header>
  );
}
