import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import api from "../api/api.js";
import Loader from "../components/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDistanceToNow } from "../utils/dateUtils.js";

export default function Reports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentAnalytics, setStudentAnalytics] = useState(null);
  const [mentorData, setMentorData] = useState({ meetings: [], plans: [] });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (user?.role === "student") {
          const { data } = await api.get("/analytics/student");
          setStudentAnalytics(data.data);
        } else {
          const [meetingsRes, plansRes] = await Promise.all([
            api.get("/collaboration/meetings"),
            api.get("/collaboration/plans")
          ]);
          setMentorData({
            meetings: meetingsRes.data.data || [],
            plans: plansRes.data.data || []
          });
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.role]);

  if (loading) return <Loader label="Loading reports" />;

  return user?.role === "student" ? (
    <>
      <div className="page-title">
        <h1>Progress Report</h1>
        <p>Weekly readiness, ATS improvement, coding pace, and mentor-guided next steps.</p>
      </div>

      <div className="metric-grid compact">
        <article className="metric-card"><span>Readiness</span><strong>{studentAnalytics?.placementReadiness || 0}%</strong></article>
        <article className="metric-card"><span>ATS</span><strong>{studentAnalytics?.resumeScore || 0}%</strong></article>
        <article className="metric-card"><span>Coding Avg</span><strong>{studentAnalytics?.codingSummary?.averageScore || 0}%</strong></article>
      </div>

      <div className="dashboard-grid">
        <section className="panel wide">
          <h2>Weakness Insights</h2>
          {(studentAnalytics?.weaknessInsights || []).length ? (
            studentAnalytics.weaknessInsights.map((item) => (
              <div className="insight-card watch" key={item.message}>
                <div>
                  <strong>{item.area}</strong>
                  <p>{item.message}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="muted">No major drops recorded in the current reporting window.</p>
          )}
        </section>

        <section className="panel">
          <h2>Active Plan</h2>
          {studentAnalytics?.activePlan ? (
            <div className="stack">
              <strong>{studentAnalytics.activePlan.title}</strong>
              <p className="muted">{studentAnalytics.activePlan.summary}</p>
            </div>
          ) : (
            <p className="muted">No mentor plan has been shared yet.</p>
          )}
        </section>

        <section className="panel">
          <h2>Mentor Notes</h2>
          {(studentAnalytics?.mentorNotes || []).length ? (
            studentAnalytics.mentorNotes.map((note) => (
              <div className="mentor-note-preview" key={note._id}>
                <strong>{note.mentorId?.name || "Mentor"}</strong>
                <p>{note.note}</p>
              </div>
            ))
          ) : (
            <p className="muted">Mentor feedback will appear here after reviews.</p>
          )}
        </section>
      </div>
    </>
  ) : (
    <>
      <div className="page-title">
        <h1>Mentor Reports</h1>
        <p>Shared plan coverage, upcoming sessions, and collaboration throughput across students.</p>
      </div>

      <div className="metric-grid compact">
        <article className="metric-card"><span>Plans</span><strong>{mentorData.plans.length}</strong></article>
        <article className="metric-card"><span>Meetings</span><strong>{mentorData.meetings.length}</strong></article>
        <article className="metric-card"><span>Pending</span><strong>{mentorData.meetings.filter((item) => item.status !== "completed").length}</strong></article>
      </div>

      <div className="dashboard-grid">
        <section className="panel wide">
          <h2>Shared Plans</h2>
          {mentorData.plans.length ? mentorData.plans.map((plan) => (
            <div className="mentor-note-preview" key={plan._id}>
              <strong>{plan.title}</strong>
              <p>{plan.summary}</p>
              <small>{plan.studentId?.userId?.name || "Student"}</small>
            </div>
          )) : <p className="muted">No plans published yet.</p>}
        </section>

        <section className="panel">
          <h2>Meetings</h2>
          {mentorData.meetings.length ? mentorData.meetings.map((meeting) => (
            <div className="mini-interview-card" key={meeting._id}>
              <strong>{meeting.topic}</strong>
              <p className="muted">{meeting.status} · {meeting.scheduledAt ? formatDistanceToNow(meeting.scheduledAt) : "not scheduled"} · {meeting.durationMinutes || 30} min</p>
              {meeting.meetingLink && (
                <a className="secondary-button" href={meeting.meetingLink} target="_blank" rel="noreferrer">
                  <ExternalLink size={14} /> Join Google Meet
                </a>
              )}
            </div>
          )) : <p className="muted">No mentor meetings recorded yet.</p>}
        </section>
      </div>
    </>
  );
}
