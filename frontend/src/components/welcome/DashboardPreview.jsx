import { motion } from "framer-motion";
import { Activity, Code2, FileCheck2, MessageSquareText } from "lucide-react";

const metrics = [
  {
    label: "Resume Score",
    value: "92%",
    detail: "ATS-ready profile",
    icon: FileCheck2
  },
  {
    label: "Interview Readiness",
    value: "87%",
    detail: "Company prep active",
    icon: Activity
  },
  {
    label: "Coding Consistency",
    value: "18 Days",
    detail: "DSA streak",
    icon: Code2
  },
  {
    label: "Mentor Reviews",
    value: "24",
    detail: "Feedback cycles",
    icon: MessageSquareText
  }
];

export default function DashboardPreview() {
  return (
    <motion.section
      className="welcome-preview"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
      aria-label="Platform preview metrics"
    >
      <div className="welcome-preview-header">
        <div>
          <span className="welcome-kicker">Preparation Overview</span>
          <h2>Operational student readiness snapshot</h2>
        </div>
        <span className="welcome-status">Live workspace</span>
      </div>

      <div className="welcome-metric-grid">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.article
              className="welcome-metric-card"
              key={metric.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.22 + index * 0.06 }}
            >
              <div className="welcome-metric-icon">
                <Icon size={18} />
              </div>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.detail}</small>
            </motion.article>
          );
        })}
      </div>
    </motion.section>
  );
}
