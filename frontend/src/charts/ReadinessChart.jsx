import { ArcElement, Chart as ChartJS, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip);

export default function ReadinessChart({ score = 0 }) {
  return (
    <Doughnut
      data={{ labels: ["Ready", "Gap"], datasets: [{ data: [score, 100 - score], backgroundColor: ["#16a34a", "#e5e7eb"], borderWidth: 0 }] }}
      options={{ cutout: "72%", plugins: { legend: { display: false } } }}
    />
  );
}
