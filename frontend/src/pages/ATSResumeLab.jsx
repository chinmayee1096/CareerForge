import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Gauge, ListChecks, Sparkles, Upload, WandSparkles } from "lucide-react";
import api from "../api/api.js";
import ScoreTrendChart from "../charts/ScoreTrendChart.jsx";
import Loader from "../components/Loader.jsx";
import NotificationToast from "../components/NotificationToast.jsx";

const initialForm = {
  company: "Amazon",
  targetRole: "Software Engineer Intern",
  fileName: "resume.txt",
  resumeText: "",
  jobDescription: ""
};

const readableResumeExtensions = [".txt", ".md"];

const getExtension = (fileName = "") => fileName.slice(fileName.lastIndexOf(".")).toLowerCase();

const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsText(file);
  });

const scoreTone = (score = 0) => {
  if (score >= 75) return "strong";
  if (score >= 55) return "watch";
  return "risk";
};

export default function ATSResumeLab() {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [review, setReview] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [toast, setToast] = useState({ message: "", type: "info" });

  const load = async () => {
    setLoading(true);
    try {
      const [profileRes, historyRes] = await Promise.all([
        api.get("/students/profile"),
        api.get("/ats/history")
      ]);

      const profile = profileRes.data.data || {};
      const atsHistory = historyRes.data.data || [];
      setHistory(atsHistory);
      setReview(atsHistory[0] || null);
      setForm((prev) => ({
        ...prev,
        company: profile.selectedCompany || prev.company,
        targetRole: profile.selectedRole || profile.targetRole || prev.targetRole,
        resumeText: profile.parsedResume?.rawText || prev.resumeText
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const trend = useMemo(() => {
    return [...history]
      .slice(0, 6)
      .reverse()
      .map((item) => ({
        label: `v${item.versionNumber}`,
        readiness: item.metrics?.atsScore || 0,
        ats: item.metrics?.keywordMatch || 0,
        coding: item.metrics?.recruiterReadability || 0
      }));
  }, [history]);

  if (loading) return <Loader label="Loading ATS workspace" />;

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const extension = getExtension(file.name);
      if (!readableResumeExtensions.includes(extension)) {
        setToast({
          message: "PDF/DOCX files need text extraction. Please paste resume text or upload a .txt/.md version for ATS analysis.",
          type: "error"
        });
        return;
      }
      const text = await readFileAsText(file);
      setForm((prev) => ({
        ...prev,
        fileName: file.name,
        resumeText: text
      }));
      setToast({ message: `${file.name} loaded into the ATS workspace.`, type: "info" });
    } catch (error) {
      setToast({ message: error.message, type: "error" });
    } finally {
      event.target.value = "";
    }
  };

  const analyze = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post("/ats/analyze", form);
      setReview(data.data);
      await load();
      setToast({ message: "ATS review completed with recruiter-style feedback.", type: "info" });
    } catch (error) {
      setToast({ message: error.message || "ATS analysis failed.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const latestScore = review?.metrics?.atsScore || 0;

  return (
    <>
      <div className="page-title row">
        <div>
          <h1>ATS Resume Lab</h1>
          <p>Upload a resume, paste a JD, and review the same alignment signals recruiters use to shortlist candidates.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="panel wide stack">
          <div className="row">
            <div>
              <span className="eyebrow">Role Alignment</span>
              <h2 style={{ marginTop: 8 }}>Run an ATS compatibility review</h2>
            </div>
            <div className="ats-upload-actions">
              <button type="button" className="secondary-button" onClick={() => fileInputRef.current?.click()}>
                <Upload size={16} /> Upload resume
              </button>
              <input ref={fileInputRef} type="file" accept=".txt,.md" onChange={handleUpload} className="sr-only-file-input" />
              {form.fileName && <span className="muted selected-file-name">{form.fileName}</span>}
            </div>
          </div>

          <form className="grid-form" onSubmit={analyze}>
            <label>
              Company
              <input name="company" value={form.company} onChange={updateForm} placeholder="Amazon" />
            </label>
            <label>
              Target role
              <input name="targetRole" value={form.targetRole} onChange={updateForm} placeholder="Software Engineer Intern" />
            </label>
            <label className="full">
              Resume text
              <textarea
                name="resumeText"
                value={form.resumeText}
                onChange={updateForm}
                className="resume-textarea"
                placeholder="Paste the latest resume text here, or upload a .txt/.md resume file. PDF/DOCX needs text extraction before ATS analysis."
              />
            </label>
            <label className="full">
              Job description
              <textarea
                name="jobDescription"
                value={form.jobDescription}
                onChange={updateForm}
                className="resume-textarea"
                placeholder="Paste the actual job description, internship posting, or role requirements."
              />
            </label>
            <button className="primary-button" disabled={submitting}>
              {submitting ? <span className="loader-spin" /> : <WandSparkles size={16} />}
              {submitting ? "Analyzing..." : "Generate ATS review"}
            </button>
          </form>
        </section>

        <section className="panel ats-summary-panel">
          <div className={`score-gauge ${scoreTone(latestScore)}`} style={{ "--score": `${latestScore}%` }}>
            <div className="score-gauge-inner">
              <strong>{latestScore}%</strong>
              <span>ATS score</span>
            </div>
          </div>
          <div className="stack">
            <div className="analytics-pill-row">
              <span className="analytics-pill"><Gauge size={14} /> Readability {review?.metrics?.recruiterReadability || 0}%</span>
              <span className="analytics-pill"><Sparkles size={14} /> Keyword match {review?.metrics?.keywordMatch || 0}%</span>
            </div>
            <p className="muted">The ATS score blends keyword coverage, recruiter readability, formatting quality, and proof of impact.</p>
          </div>
        </section>

        <section className="panel wide">
          <div className="row" style={{ marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>Improvement Trend</h2>
            <span className="muted">Last {Math.min(history.length, 6)} resume reviews</span>
          </div>
          <ScoreTrendChart trend={trend} compact />
        </section>

        <section className="panel">
          <h2>Keyword Breakdown</h2>
          {(review?.keywordGroups || []).length ? (
            <div className="stack">
              {review.keywordGroups.map((group) => (
                <div className="keyword-group-card" key={group.label}>
                  <div className="row">
                    <strong>{group.label}</strong>
                    <span className={`status-pill status-${group.score >= 70 ? "offer" : group.score >= 45 ? "oa-cleared" : "rejected"}`}>{group.score}%</span>
                  </div>
                  <p className="muted" style={{ margin: "6px 0" }}>Matched: {group.matched.join(", ") || "None yet"}</p>
                  {group.missing.length > 0 && (
                    <p className="muted" style={{ margin: 0 }}>Missing: {group.missing.join(", ")}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Run one review to see which keyword clusters are already covered and which are still missing.</p>
          )}
        </section>

        <section className="panel">
          <h2>Missing Skills</h2>
          {(review?.missingSkills || []).length ? (
            <div className="chip-cloud">
              {review.missingSkills.map((item) => (
                <span className="tag pill medium" key={item}>{item}</span>
              ))}
            </div>
          ) : (
            <p className="muted">No major skill gaps were detected against the current JD.</p>
          )}
        </section>

        <section className="panel">
          <h2>Formatting Issues</h2>
          {(review?.formattingIssues || []).length ? (
            review.formattingIssues.map((issue) => (
              <div className="insight-card risk" key={issue}>
                <FileText size={16} />
                <div>
                  <strong>Formatting risk</strong>
                  <p>{issue}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="muted">Formatting looks recruiter-friendly on the current version.</p>
          )}
        </section>

        <section className="panel wide">
          <h2>Optimization Suggestions</h2>
          {(review?.optimizationSuggestions || []).length ? (
            <div className="stack">
              {review.optimizationSuggestions.map((item) => (
                <div className="insight-card watch" key={item}>
                  <ListChecks size={16} />
                  <div>
                    <strong>Resume action</strong>
                    <p>{item}</p>
                  </div>
                </div>
              ))}
              {(review?.roleSuggestions || []).map((item) => (
                <div className="insight-card strong" key={item}>
                  <Sparkles size={16} />
                  <div>
                    <strong>Role-specific improvement</strong>
                    <p>{item}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No ATS suggestions yet. Start with one resume and one job description.</p>
          )}
        </section>

        <section className="panel wide">
          <div className="row" style={{ marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>Resume Version History</h2>
            <span className="muted">Stored ATS snapshots and score deltas</span>
          </div>
          {history.length ? (
            <div className="stack">
              {history.map((item) => (
                <button type="button" className="history-row" key={item._id} onClick={() => setReview(item)}>
                  <div>
                    <strong>{item.fileName || `Version ${item.versionNumber}`}</strong>
                    <p className="muted">{item.company || "General role"} · {item.targetRole || "Role not specified"}</p>
                  </div>
                  <div className="history-row-score">
                    <strong>{item.metrics?.atsScore || 0}%</strong>
                    <span className={item.trend?.scoreDelta >= 0 ? "trend-up" : "trend-down"}>
                      {item.trend?.scoreDelta >= 0 ? "+" : ""}{item.trend?.scoreDelta || 0}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="muted">Each ATS review stores a resume snapshot so students and mentors can track improvement over time.</p>
          )}
        </section>
      </div>

      <NotificationToast message={toast.message} type={toast.type} />
    </>
  );
}
