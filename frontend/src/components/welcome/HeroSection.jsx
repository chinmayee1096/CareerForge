import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, LogIn, UserPlus } from "lucide-react";
import DashboardPreview from "./DashboardPreview.jsx";

const headlineText = "AI-Powered Placement Preparation & Student Progress Tracker";
const words = headlineText.split(" ");

const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const wordVariants = {
  hidden: {
    opacity: 0,
    y: 12,
    scale: 0.92,
    textShadow: "0 0 0px rgba(94, 234, 212, 0)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    textShadow: [
      "0 0 0px rgba(94, 234, 212, 0)",
      "0 0 35px rgba(94, 234, 212, 1), 0 0 15px rgba(99, 102, 241, 0.8)",
      "0 0 12px rgba(94, 234, 212, 0.3)",
      "0 0 0px rgba(94, 234, 212, 0)"
    ],
    color: ["#f8fafc", "#5eead4", "#f8fafc"],
    transition: {
      type: "spring",
      damping: 14,
      stiffness: 110,
      textShadow: { duration: 1.4, ease: "easeOut" },
      color: { duration: 1.4, ease: "easeOut" }
    }
  },
};

export default function HeroSection() {
  return (
    <main className="welcome-main" style={{ position: "relative", zIndex: 2 }}>
      <motion.section
        className="welcome-hero"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <span className="welcome-kicker">Placement readiness platform</span>
        <motion.h1
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            columnGap: "0.25em",
            rowGap: "0.1em",
            margin: "0 auto 16px",
          }}
        >
          {words.map((word, i) => (
            <motion.span
              key={i}
              variants={wordVariants}
              style={{ display: "inline-block" }}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>
        <p>
          Prepare smarter, track progress, improve interview performance, and collaborate with mentors through a unified placement preparation platform.
        </p>

        <DashboardPreview />

        <div className="welcome-actions">
          <Link className="welcome-primary-action" to="/login">
            <LogIn size={18} />
            Login
            <ArrowRight size={16} />
          </Link>
          <Link className="welcome-secondary-action" to="/register">
            <UserPlus size={18} />
            Create Account
          </Link>
        </div>
      </motion.section>
    </main>
  );
}
