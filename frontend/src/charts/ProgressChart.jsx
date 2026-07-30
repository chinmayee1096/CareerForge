import { Bar } from "react-chartjs-2";
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

export default function ProgressChart({ values = [40, 55, 68, 72, 80] }) {
  return (
    <Bar
      data={{
        labels: ["Aptitude", "Coding", "HR", "Resume", "Projects"],
        datasets: [{ label: "Completion", data: values, backgroundColor: "#2563eb", borderRadius: 6 }]
      }}
      options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { max: 100 } } }}
    />
  );
}
