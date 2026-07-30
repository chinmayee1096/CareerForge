import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarClock,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Target,
  TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/api.js";
import ReadinessRadarChart from "../charts/ReadinessRadarChart.jsx";
import ScoreTrendChart from "../charts/ScoreTrendChart.jsx";
import Loader from "../components/Loader.jsx";
import NotificationToast from "../components/NotificationToast.jsx";
import { formatDistanceToNow } from "../utils/dateUtils.js";

export default function StudentDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [mentorRequest, setMentorRequest] = useState("");
  const [toast, setToast] = useState({ message: "", type: "info" });

  const load = async () => {
    const [analyticsRes, tasksRes] = await Promise.all([
      api.get("/analytics/student"),
      api.get("/tasks?limit=5&status=pending")
    ]);

    setAnalytics(analyticsRes.data.data);
    setUpcomingTasks(tasksRes.data.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  if (!analytics) return <Loader label="Loading placement readiness" />;

  const requestMentorReview = async () => {
    await api.post("/collaboration/meetings", {
      topic: "Mentor review requested",
      agenda: mentorRequest || "Please review my current ATS score, interview readiness, and active applications."
    });
    setMentorRequest("");
    setToast({ message: "Mentor review request sent.", type: "info" });
    load();
  };

  const readiness = analytics.placementReadiness || 0;
  const atsScore = analytics.latestAts?.metrics?.atsScore || analytics.resumeScore || 0;

  return (
    <>
      <div className="page-title">
        <h1>Placement Readiness Dashboard</h1>
        <p>A startup-style control center for resume quality, interview depth, coding consistency, communication, and real application momentum.</p>
      </div>

      <section className="hero-panel">
        <div>
          <span className="eyebrow">Overall Readiness</span>
          <h2>{readiness}% placement readiness</h2>
          <p>Computed from ATS quality, interview performance, coding submissions, communication signals, tasks, and actual application progress.</p>
          <div className="hero-progress-bar">
            <div className="hero-progress-fill" style={{ width: `${readiness}%`, background: "#0f766e" }} />
          </div>
        </div>
        <div className="hero-actions">
          <Link className="primary-button" to="/interview"><Target size={16} /> Start company interview</Link>
          <Link className="secondary-button" to="/ats"><Sparkles size={16} /> Improve ATS score</Link>
          <Link className="secondary-button" to="/coding"><TrendingUp size={16} /> Practice coding</Link>
        </div>
      </section>

      <div className="metric-grid">
        <article className="metric-card"><span>Interview Readiness</span><strong>{analytics.readinessBreakdown?.interview || 0}%</strong></article>
        <article className="metric-card"><span>Aptitude Readiness</span><strong>{analytics.readinessBreakdown?.aptitude || 0}%</strong></article>
        <article className="metric-card"><span>Coding Consistency</span><strong>{analytics.readinessBreakdown?.coding || 0}%</strong></article>
        <article className="metric-card"><span>Communication</span><strong>{analytics.readinessBreakdown?.communication || 0}%</strong></article>
        <article className="metric-card"><span>Resume Quality</span><strong>{atsScore}%</strong></article>
        <article className="metric-card"><span>Application Readiness</span><strong>{analytics.readinessBreakdown?.applications || 0}%</strong></article>
        <article className="metric-card"><span>Interview Conversion</span><strong>{analytics.applicationAnalytics?.interviewConversion || 0}%</strong></article>
        <article className="metric-card"><span>Offer Ratio</span><strong>{analytics.applicationAnalytics?.successRatio || 0}%</strong></article>
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <h2>Readiness Radar</h2>
          <ReadinessRadarChart breakdown={analytics.readinessBreakdown} />
        </section>

        <section className={`panel ${analytics.weeklyTrend?.length ? "wide" : "compact-trend-panel"}`}>
          <div className="row" style={{ marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>Weekly Trend</h2>
            <span className="muted">ATS, coding, and overall progress</span>
          </div>
          <ScoreTrendChart trend={analytics.weeklyTrend} compact />
        </section>

        <section className="panel">
          <h2>Heatmap</h2>
          <div className="heatmap-grid">
            {(analytics.heatmap || []).map((cell) => (
              <div className={`heatmap-cell ${cell.band}`} key={cell.label}>
                <span>{cell.label}</span>
                <strong>{cell.score}%</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="panel wide">
          <h2>Weakness Detection Engine</h2>
          {(analytics.weaknessInsights || []).length ? (
            <div className="stack">
              {analytics.weaknessInsights.map((item) => (
                <div className={`insight-card ${item.severity === "high" ? "risk" : "watch"}`} key={`${item.area}-${item.message}`}>
                  <div>
                    <strong>{item.area}</strong>
                    <p>{item.message}</p>
                    <small>{item.recommendation}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No high-risk drops detected in the current window. Keep feeding the system with interviews and coding submissions.</p>
          )}
        </section>

        <section className="panel">
          <h2>ATS Snapshot</h2>
          <div className="stack">
            <div className="history-row">
              <div>
                <strong>{analytics.latestAts?.company || "Latest review"}</strong>
                <p className="muted">{analytics.latestAts?.targetRole || "Target role not set"}</p>
              </div>
              <div className="history-row-score">
                <strong>{atsScore}%</strong>
                <span className={analytics.latestAts?.trend?.scoreDelta >= 0 ? "trend-up" : "trend-down"}>
                  {analytics.latestAts?.trend?.scoreDelta >= 0 ? "+" : ""}{analytics.latestAts?.trend?.scoreDelta || 0}
                </span>
              </div>
            </div>
            {(analytics.latestAts?.missingSkills || []).slice(0, 4).map((item) => (
              <span className="tag pill medium" key={item}>{item}</span>
            ))}
            <Link className="text-link" to="/ats">Open ATS workspace <ArrowUpRight size={14} /></Link>
          </div>
        </section>

        <section className="panel">
          <h2>Coding Platform</h2>
          <div className="stack">
            <div className="history-row">
              <div>
                <strong>{analytics.codingSummary?.acceptedCount || 0} accepted</strong>
                <p className="muted">{analytics.codingSummary?.totalSubmissions || 0} tracked submissions</p>
              </div>
              <strong>{analytics.codingSummary?.averageScore || 0}%</strong>
            </div>
            {(analytics.codingSummary?.recentSubmissions || []).slice(0, 3).map((item) => (
              <div className="mini-interview-card" key={item._id}>
                <strong>{item.problemId?.title || "Problem"}</strong>
                <p className="muted">{item.problemId?.difficulty} · {item.verdict.replace(/-/g, " ")}</p>
              </div>
            ))}
            <Link className="text-link" to="/coding">Open coding arena <ArrowUpRight size={14} /></Link>
          </div>
        </section>

        <section className="panel">
          <h2>Application Workflow</h2>
          <div className="stack">
            <div className="history-row">
              <div>
                <strong>{analytics.applicationAnalytics?.activeCount || 0} active roles</strong>
                <p className="muted">Most applied: {(analytics.applicationAnalytics?.mostAppliedRoles || []).map((item) => item.role).join(", ") || "No applications yet"}</p>
              </div>
              <strong>{analytics.applicationAnalytics?.successRatio || 0}%</strong>
            </div>
            {(analytics.applications || []).slice(0, 3).map((app) => (
              <div className="mini-interview-card" key={app._id}>
                <div className="mic-header">
                  <strong>{app.company}</strong>
                  <span className={`status-pill status-${app.status}`}>{app.status}</span>
                </div>
                <p className="muted">{app.role}</p>
              </div>
            ))}
            <Link className="text-link" to="/applications">Open tracker <ArrowUpRight size={14} /></Link>
          </div>
        </section>

        <section className="panel">
          <h2>Shared Preparation Plan</h2>
          {analytics.activePlan ? (
            <div className="stack">
              <strong>{analytics.activePlan.title}</strong>
              <p className="muted">{analytics.activePlan.summary}</p>
              {(analytics.activePlan.milestones || []).slice(0, 4).map((milestone) => (
                <div className="check-line" key={milestone._id || milestone.title}>{milestone.title}</div>
              ))}
            </div>
          ) : (
            <p className="muted">No shared plan yet. Ask your mentor to publish one, or request a review below.</p>
          )}
        </section>

        <section className="panel">
          <h2>Mentor Collaboration</h2>
          <div className="stack">
            <textarea
              value={mentorRequest}
              onChange={(event) => setMentorRequest(event.target.value)}
              placeholder="Ask for resume review, interview feedback, or a focused plan for one weak topic."
            />
            <button className="primary-button" onClick={requestMentorReview}>
              <MessageSquare size={16} /> Request mentor review
            </button>
            {(analytics.meetings || []).slice(0, 3).map((meeting) => (
              <div className="mini-interview-card" key={meeting._id}>
                <div className="mic-header">
                  <strong>{meeting.topic}</strong>
                  <span className={`status-pill status-${meeting.status}`}>{meeting.status}</span>
                </div>
                <p className="muted">{meeting.mentorId?.name || "Mentor"} · {meeting.scheduledAt ? formatDistanceToNow(meeting.scheduledAt) : "awaiting schedule"} · {meeting.durationMinutes || 30} min</p>
                {meeting.meetingLink && (
                  <a className="secondary-button" href={meeting.meetingLink} target="_blank" rel="noreferrer">
                    <ExternalLink size={14} /> Join Google Meet
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Pending Tasks</h2>
          {upcomingTasks.length ? (
            upcomingTasks.map((task) => (
              <div className="check-line" key={task._id}>{task.title}</div>
            ))
          ) : (
            <p className="muted">No pending tasks right now. Add one from your coding, ATS, or interview plan.</p>
          )}
        </section>

        <section className="panel wide">
          <h2>Recent Activity</h2>
          {(analytics.recentActivities || []).length ? (
            <div className="timeline-list">
              {analytics.recentActivities.map((activity) => (
                <div className="timeline-item" key={activity._id}>
                  <span className="timeline-dot" />
                  <div>
                    <strong>{activity.title}</strong>
                    <p>{activity.message || "Updated recently."}</p>
                    <small>{activity.actorId?.name || "You"} · {formatDistanceToNow(activity.createdAt)}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Activity from interviews, ATS reviews, coding submissions, and mentor collaboration will appear here.</p>
          )}
        </section>
      </div>

      <NotificationToast message={toast.message} type={toast.type} />
    </>
  );
}
