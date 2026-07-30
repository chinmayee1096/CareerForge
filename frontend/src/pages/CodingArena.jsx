import { useEffect, useMemo, useState } from "react";
import { Code2, Filter, Play, Send, Trophy } from "lucide-react";
import api from "../api/api.js";
import Loader from "../components/Loader.jsx";
import NotificationToast from "../components/NotificationToast.jsx";
import { formatDistanceToNow } from "../utils/dateUtils.js";

const languageLabels = {
  javascript: "JavaScript",
  python: "Python",
  java: "Java",
  cpp: "C++"
};

const verdictLabel = (verdict = "") =>
  verdict.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function CodingArena() {
  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState("javascript");
  const [drafts, setDrafts] = useState({});
  const [submissions, setSubmissions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardMeta, setLeaderboardMeta] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({ search: "", difficulty: "", category: "" });
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [streak, setStreak] = useState(0);

  const loadShell = async () => {
    setLoading(true);
    try {
      const [problemsRes, leaderboardRes, submissionsRes] = await Promise.all([
        api.get("/coding/problems"),
        api.get("/coding/leaderboard"),
        api.get("/coding/submissions"),
      ]);
      const nextProblems = problemsRes.data.data || [];
      setProblems(nextProblems);
      setSelectedSlug((current) => current || nextProblems[0]?.slug || "");
      setLeaderboard(leaderboardRes.data.data || []);
      setLeaderboardMeta(leaderboardRes.data.meta || null);
      setSubmissions(submissionsRes.data.data || []);
      setStreak(submissionsRes.data.meta?.streak || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShell();
  }, []);

  useEffect(() => {
    if (!selectedSlug) return;

    api.get(`/coding/problems/${selectedSlug}`).then(({ data }) => {
      const nextProblem = data.data;
      setProblem(nextProblem);
      setRunResult(null);

      const currentDraftKey = `${nextProblem._id}:${language}`;
      if (!drafts[currentDraftKey]) {
        const template = nextProblem.templates?.find((item) => item.language === language)?.starterCode || "";
        setDrafts((prev) => ({ ...prev, [currentDraftKey]: template }));
      }
    });
  }, [selectedSlug, language]);

  const filteredProblems = useMemo(() => {
    return problems.filter((item) => {
      const matchesSearch = [item.title, item.category, ...(item.tags || [])].join(" ").toLowerCase().includes(filters.search.toLowerCase());
      const matchesDifficulty = filters.difficulty ? item.difficulty === filters.difficulty : true;
      const matchesCategory = filters.category ? item.category === filters.category : true;
      return matchesSearch && matchesDifficulty && matchesCategory;
    });
  }, [problems, filters]);

  if (loading) return <Loader label="Loading coding arena" />;

  const editorKey = problem ? `${problem._id}:${language}` : "";
  const code = drafts[editorKey] || "";
  const codeLines = Math.max(code.split("\n").length, 12);

  const setCode = (value) => {
    setDrafts((prev) => ({ ...prev, [editorKey]: value }));
  };

  const handleLanguageChange = (nextLanguage) => {
    setLanguage(nextLanguage);
    if (problem) {
      const nextKey = `${problem._id}:${nextLanguage}`;
      if (!drafts[nextKey]) {
        const template = problem.templates?.find((item) => item.language === nextLanguage)?.starterCode || "";
        setDrafts((prev) => ({ ...prev, [nextKey]: template }));
      }
    }
  };

  const runCode = async () => {
    if (!problem) return;
    setRunning(true);
    try {
      const { data } = await api.post("/coding/run", {
        problemId: problem._id,
        language,
        code
      });
      setRunResult(data.data);
      setToast({ message: "Sample test cases executed.", type: "info" });
    } catch (error) {
      setToast({ message: error.message || "Code execution failed.", type: "error" });
    } finally {
      setRunning(false);
    }
  };

  const submitCode = async () => {
    if (!problem) return;
    setSubmitting(true);
    try {
      const { data } = await api.post("/coding/submit", {
        problemId: problem._id,
        language,
        code
      });
      setRunResult({
        verdict: data.data.verdict,
        runtimeMs: data.data.runtimeMs,
        cases: data.data.cases
      });
      await loadShell();
      setToast({ message: `Submission recorded: ${verdictLabel(data.data.verdict)}.`, type: "info" });
    } catch (error) {
      setToast({ message: error.message || "Submission failed.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-title row">
        <div>
          <h1>Coding Assessment Arena</h1>
          <p>Browser-based coding rounds with language switching, test execution, submissions, streaks, and live leaderboard context.</p>
        </div>
      </div>

      <section className="hero-panel">
        <div>
          <span className="eyebrow">Assessment Engine</span>
          <h2>{streak} day coding streak</h2>
          <p>Track accepted submissions, revisit weak topics, and practice against structured placement-style problem statements.</p>
        </div>
        <div className="analytics-pill-row">
          <span className="analytics-pill"><Trophy size={14} /> Leaderboard</span>
          <span className="analytics-pill"><Code2 size={14} /> Multi-language</span>
          <span className="analytics-pill"><Filter size={14} /> DSA filtering</span>
        </div>
      </section>

      <div className="coding-layout">
        <section className="panel coding-sidebar-panel">
          <div className="stack">
            <div className="row">
              <h2 style={{ margin: 0 }}>Problem Bank</h2>
              <span className="muted">{filteredProblems.length} items</span>
            </div>
            <div className="stack">
              <input
                value={filters.search}
                onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                placeholder="Search title, tag, or topic"
              />
              <div className="filter-row">
                <select value={filters.difficulty} onChange={(event) => setFilters((prev) => ({ ...prev, difficulty: event.target.value }))}>
                  <option value="">All difficulty</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <select value={filters.category} onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}>
                  <option value="">All categories</option>
                  {[...new Set(problems.map((item) => item.category))].map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="stack coding-problem-list">
            {filteredProblems.map((item) => (
              <button
                type="button"
                key={item._id}
                className={`problem-list-item ${selectedSlug === item.slug ? "active" : ""}`}
                onClick={() => setSelectedSlug(item.slug)}
              >
                <div className="row">
                  <strong>{item.title}</strong>
                  <span className={`status-pill status-${item.difficulty === "easy" ? "offer" : item.difficulty === "medium" ? "oa-cleared" : "rejected"}`}>{item.difficulty}</span>
                </div>
                <p className="muted">{item.category}</p>
                <div className="chip-cloud">
                  {(item.tags || []).slice(0, 3).map((tag) => <span className="tag" key={tag}>{tag}</span>)}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="stack">
          <section className="panel">
            {problem ? (
              <>
                <div className="row" style={{ marginBottom: 12 }}>
                  <div>
                    <span className="eyebrow">{problem.category}</span>
                    <h2 style={{ margin: "8px 0 0" }}>{problem.title}</h2>
                  </div>
                  <div className="analytics-pill-row">
                    {(problem.companies || []).map((company) => <span key={company} className="analytics-pill">{company}</span>)}
                  </div>
                </div>
                <p className="muted">{problem.statement}</p>
                <div className="dashboard-grid coding-detail-grid">
                  <div className="panel stack">
                    <h3>Input Format</h3>
                    <p className="muted">{problem.inputFormat}</p>
                    <h3>Output Format</h3>
                    <p className="muted">{problem.outputFormat}</p>
                  </div>
                  <div className="panel stack">
                    <h3>Constraints</h3>
                    {(problem.constraints || []).map((item) => <div className="check-line" key={item}>{item}</div>)}
                  </div>
                </div>
              </>
            ) : (
              <Loader label="Loading problem details" />
            )}
          </section>

          <section className="panel">
            <div className="row" style={{ marginBottom: 12 }}>
              <h2 style={{ margin: 0 }}>Code Editor</h2>
              <div className="button-row">
                <select value={language} onChange={(event) => handleLanguageChange(event.target.value)}>
                  {Object.entries(languageLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <button className="secondary-button" onClick={runCode} disabled={running || !problem}>
                  <Play size={15} /> {running ? "Running..." : "Run tests"}
                </button>
                <button className="primary-button" onClick={submitCode} disabled={submitting || !problem}>
                  <Send size={15} /> {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>

            <div className="editor-shell">
              <div className="editor-gutter">
                {Array.from({ length: codeLines }, (_, index) => (
                  <span key={index}>{index + 1}</span>
                ))}
              </div>
              <textarea
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="code-editor"
                spellCheck={false}
              />
            </div>
          </section>

          <section className="panel">
            <div className="row" style={{ marginBottom: 12 }}>
              <h2 style={{ margin: 0 }}>Execution Output</h2>
              {runResult?.verdict && <span className={`status-pill status-${runResult.verdict === "accepted" ? "offer" : runResult.verdict === "wrong-answer" ? "rejected" : "oa-cleared"}`}>{verdictLabel(runResult.verdict)}</span>}
            </div>
            {runResult ? (
              <div className="stack">
                <p className="muted">Runtime: {runResult.runtimeMs || 0} ms</p>
                {(runResult.cases || []).map((item, index) => (
                  <div className={`testcase-card ${item.passed ? "passed" : "failed"}`} key={`${index}-${item.message}`}>
                    <div className="row">
                      <strong>Case {index + 1}</strong>
                      <span>{item.passed ? "Passed" : "Failed"}</span>
                    </div>
                    {!item.hidden && (
                      <>
                        <pre>{item.input}</pre>
                        <pre>{item.expectedOutput}</pre>
                        <pre>{item.actualOutput}</pre>
                      </>
                    )}
                    {item.message && <p className="muted">{item.message}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">Run sample tests or submit to evaluate the full test suite.</p>
            )}
          </section>
        </section>

        <section className="stack">
          <section className="panel">
            <div className="row" style={{ marginBottom: 12 }}>
              <h2 style={{ margin: 0 }}>Submission History</h2>
              <span className="muted">{submissions.length} recent submissions</span>
            </div>
            <div className="stack">
              {submissions.slice(0, 8).map((item) => (
                <div className="history-row" key={item._id}>
                  <div>
                    <strong>{item.problemId?.title || "Problem"}</strong>
                    <p className="muted">{languageLabels[item.language]} · {item.problemId?.category}</p>
                  </div>
                  <div className="history-row-score">
                    <strong>{item.score}%</strong>
                    <span className={`status-pill status-${item.verdict === "accepted" ? "offer" : item.verdict === "wrong-answer" ? "rejected" : "oa-cleared"}`}>
                      {verdictLabel(item.verdict)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="row" style={{ marginBottom: 12 }}>
              <h2 style={{ margin: 0 }}>Leaderboard</h2>
              <span className="muted">Last {leaderboardMeta?.windowHours || 24} hours</span>
            </div>
            <p className="muted leaderboard-refresh-note">
              Updates every 24 hours. Next refresh {leaderboardMeta?.refreshesAt ? formatDistanceToNow(leaderboardMeta.refreshesAt) : "after the daily window"}.
            </p>
            <div className="stack">
              {leaderboard.length ? leaderboard.map((entry) => (
                <div className="leaderboard-row competitive" key={entry.userId}>
                  <div className="leaderboard-rank">{entry.rank}</div>
                  <div className="leaderboard-student">
                    <strong>{entry.name}</strong>
                    <div className="leaderboard-progress">
                      <span style={{ width: `${entry.scorePercentage || 0}%` }} />
                    </div>
                    <p className="muted">{entry.acceptedCount} accepted · {entry.attempts} attempts</p>
                  </div>
                  <div className="leaderboard-score">
                    <strong>{entry.scorePercentage || 0}%</strong>
                    <span>daily score</span>
                  </div>
                </div>
              )) : (
                <p className="muted">No submissions in the last 24 hours. Be the first student on today&apos;s leaderboard.</p>
              )}
            </div>
          </section>
        </section>
      </div>

      <NotificationToast message={toast.message} type={toast.type} />
    </>
  );
}
