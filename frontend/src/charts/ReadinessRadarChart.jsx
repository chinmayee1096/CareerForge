import {
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadarController,
  RadialLinearScale,
  Tooltip
} from "chart.js";
import { Radar } from "react-chartjs-2";

ChartJS.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function ReadinessRadarChart({ breakdown = {} }) {
  const labels = ["Interview", "Aptitude", "Coding", "Communication", "Applications", "Resume"];
  const values = [
    breakdown.interview || 0,
    breakdown.aptitude || 0,
    breakdown.coding || 0,
    breakdown.communication || 0,
    breakdown.applications || 0,
    breakdown.resume || 0
  ];

  return (
    <Radar
      data={{
        labels,
        datasets: [
          {
            label: "Readiness",
            data: values,
            borderColor: "#1f7a6d",
            backgroundColor: "rgba(31, 122, 109, 0.18)",
            pointBackgroundColor: "#134e4a",
            pointBorderColor: "#ffffff",
            borderWidth: 2
          }
        ]
      }}
      options={{
        plugins: { legend: { display: false } },
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { stepSize: 20, backdropColor: "transparent" },
            angleLines: { color: "rgba(15, 23, 42, 0.1)" },
            grid: { color: "rgba(15, 23, 42, 0.08)" },
            pointLabels: { color: "#0f172a", font: { size: 11, weight: "600" } }
          }
        }
      }}
    />
  );
}
