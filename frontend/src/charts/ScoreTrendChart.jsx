import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LineElement, LinearScale, PointElement, Tooltip, Legend);

export default function ScoreTrendChart({ trend = [], compact = false }) {
  if (!trend.length) {
    return (
      <div className="trend-empty-state">
        <strong>No weekly trend yet</strong>
        <span>Complete interviews, ATS reviews, or coding submissions this week to generate progress history.</span>
      </div>
    );
  }

  const labels = trend.map((item) => item.label);
  const readiness = trend.map((item) => item.readiness);
  const ats = trend.map((item) => item.ats);
  const coding = trend.map((item) => item.coding);

  return (
    <div className={compact ? "trend-chart compact-trend-chart" : "trend-chart"}>
      <Line
        data={{
          labels,
          datasets: [
            {
              label: "Overall",
              data: readiness,
              borderColor: "#0f766e",
              backgroundColor: "rgba(15, 118, 110, 0.18)",
              tension: 0.35
            },
            {
              label: "ATS",
              data: ats,
              borderColor: "#b45309",
              backgroundColor: "rgba(180, 83, 9, 0.15)",
              tension: 0.35
            },
            {
              label: "Coding",
              data: coding,
              borderColor: "#1d4ed8",
              backgroundColor: "rgba(29, 78, 216, 0.15)",
              tension: 0.35
            }
          ]
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { boxWidth: 10, usePointStyle: true } }
          },
          scales: {
            y: { min: 0, max: 100, ticks: { stepSize: 20 } }
          }
        }}
      />
    </div>
  );
}
