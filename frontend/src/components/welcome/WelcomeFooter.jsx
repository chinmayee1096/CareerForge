import { Github, Mail } from "lucide-react";

export default function WelcomeFooter() {
  return (
    <footer className="welcome-footer" style={{ position: "relative", zIndex: 2 }}>
      <span>© 2026 CareerForge. All rights reserved.</span>
      <span>Version 1.0.0</span>
      <a href="mailto:support@careerforge.local">
        <Mail size={14} />
        Contact
      </a>
      <a href="https://github.com/" target="_blank" rel="noreferrer">
        <Github size={14} />
        GitHub
      </a>
    </footer>
  );
}
