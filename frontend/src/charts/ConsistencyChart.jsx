import { Chart as ChartJS, LineElement, LinearScale, PointElement, CategoryScale, Tooltip } from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(LineElement, LinearScale, PointElement, CategoryScale, Tooltip);

export default function ConsistencyChart({ logs = [] }) {
  const labels = logs.length ? logs.map((log) => new Date(log.date).toLocaleDateString()) : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const data = logs.length ? logs.map((log) => log.consistencyScore) : [60, 70, 65, 78, 88, 80, 90];
  return (
    <Line
      data={{ labels, datasets: [{ label: "Consistency", data, borderColor: "#f59e0b", backgroundColor: "#fef3c7", tension: 0.35 }] }}
      options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { max: 100 } } }}
    />
  );
}
