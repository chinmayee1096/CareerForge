import { useEffect, useState } from "react";
import api from "../api/api.js";
import Loader from "../components/Loader.jsx";

export default function PlacementGuide() {
  const [data, setData] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState("TCS");

  useEffect(() => {
    api.get("/placement/guidance").then(({ data }) => setData(data.data));
  }, []);

  if (!data) return <Loader label="Building your preparation guide" />;

  const companyNames = ["TCS", "Infosys", "Wipro", "Accenture", "Amazon", "Google", "Microsoft", "Startups"];
  const path = data.companyPath;

  return (
    <>
      <div className="page-title row">
        <div>
          <h1>Placement Guide</h1>
          <p>Roadmaps, etiquette, confidence routines, and company-focused preparation.</p>
        </div>
        <select value={selectedCompany} onChange={(event) => setSelectedCompany(event.target.value)}>
          {companyNames.map((company) => <option key={company}>{company}</option>)}
        </select>
      </div>

      <section className="hero-panel">
        <div>
          <span className="eyebrow">Company Path</span>
          <h2>{selectedCompany} preparation path</h2>
          <p>{path.pattern}</p>
        </div>
        <div className="chip-cloud">{path.focus.map((item) => <span className="tag" key={item}>{item}</span>)}</div>
      </section>

      <div className="dashboard-grid">
        <section className="panel wide">
          <h2>Personalized Daily Plan</h2>
          <div className="guide-grid">
            {data.aiGuidance.dailyRecommendations.map((item) => <article className="mini-card" key={item}>{item}</article>)}
          </div>
        </section>
        <section className="panel">
          <h2>Weak Area Plan</h2>
          {data.aiGuidance.weakAreaPlan.map((item) => <p className="check-line" key={item}>{item}</p>)}
        </section>
        {data.staticGuidance.map((section) => (
          <section className="panel" key={section.title}>
            <h2>{section.title}</h2>
            {section.points.map((point) => <p className="check-line" key={point}>{point}</p>)}
          </section>
        ))}
      </div>
    </>
  );
}
