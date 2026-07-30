import { useEffect, useState } from "react";
import api from "../api/api.js";
import Loader from "../components/Loader.jsx";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/analytics/admin").then(({ data }) => setData(data.data)); }, []);
  if (!data) return <Loader label="Loading platform analytics" />;
  return (
    <>
      <div className="page-title"><h1>Admin Dashboard</h1><p>System overview and platform activity.</p></div>
      <div className="metric-grid">
        {Object.entries(data).map(([key, value]) => <article className="metric-card" key={key}><span>{key.replace(/([A-Z])/g, " $1")}</span><strong>{value}</strong></article>)}
      </div>
    </>
  );
}
