import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, ClipboardList, ExternalLink, MessageSquare, Search, StickyNote, TrendingUp, Users, Video } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/api.js";
import Loader from "../components/Loader.jsx";
import EmptyState from "../components/EmptyState.jsx";
import NotificationToast from "../components/NotificationToast.jsx";
import { formatDistanceToNow } from "../utils/dateUtils.js";

const parseMilestones = (raw) =>
  raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((title) => ({ title, status: "pending" }));

const getDefaultReviewTime = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(16, 0, 0, 0);
  return date.toISOString().slice(0, 16);
};

export default function MentorDashboard() {
  const [students, setStudents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [note, setNote] = useState("");
  const [taskPayload, setTaskPayload] = useState({ title: "", category: "coding", deadline: "", priority: "medium" });
  const [planPayload, setPlanPayload] = useState({ title: "", focusCompany: "", summary: "", milestones: "" });
  const [meetingPayload, setMeetingPayload] = useState({
    topic: "Student improvement review",
    agenda: "Discuss recent interview performance, weak topics, resume quality, and next improvement actions.",
    scheduledAt: getDefaultReviewTime(),
    durationMinutes: 30,
    meetingLink: "https://meet.google.com/new"
  });
  const [toast, setToast] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [studentsRes, activityRes, meetingsRes, plansRes] = await Promise.all([
        api.get("/students?limit=50"),
        api.get("/activity?limit=15"),
        api.get("/collaboration/meetings"),
        api.get("/collaboration/plans")
      ]);
      setStudents(studentsRes.data.data || []);
      setActivities(activityRes.data.data || []);
      setMeetings(meetingsRes.data.data || []);
      setPlans(plansRes.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const blob = [student.userId?.name, student.userId?.email, student.targetRole, student.department].join(" ").toLowerCase();
      return blob.includes(query.toLowerCase());
    });
  }, [students, query]);

  const atRiskStudents = filteredStudents.filter((student) => (student.readinessScore || 0) < 55);

  if (loading) return <Loader label="Loading mentor workspace" />;

  const avgReadiness = students.length
    ? Math.round(students.reduce((sum, student) => sum + (student.readinessScore || 0), 0) / students.length)
    : 0;

  const addNote = async (event) => {
    event.preventDefault();
    if (!selectedStudent || !note.trim()) return;
    await api.post("/collaboration/notes", {
      studentId: selectedStudent,
      note,
      tone: "next-step",
      reaction: "needs-practice",
      actionItems: note.split("\n").slice(1).filter(Boolean)
    });
    setNote("");
    setToast("Mentor note shared.");
    load();
  };

  const assignTask = async (event) => {
    event.preventDefault();
    if (!selectedStudent || !taskPayload.title.trim()) return;
    await api.post("/tasks", {
      studentId: selectedStudent,
      title: taskPayload.title,
      category: taskPayload.category,
      deadline: taskPayload.deadline,
      priority: taskPayload.priority
    });
    setTaskPayload({ title: "", category: "coding", deadline: "", priority: "medium" });
    setToast("Custom task assigned to the student.");
    load();
  };

  const requestMeeting = async (event) => {
    event.preventDefault();
    if (!selectedStudent) return;
    await api.post("/collaboration/meetings", {
      studentId: selectedStudent,
      ...meetingPayload
    });
    setMeetingPayload({
      topic: "Student improvement review",
      agenda: "Discuss recent interview performance, weak topics, resume quality, and next improvement actions.",
      scheduledAt: getDefaultReviewTime(),
      durationMinutes: 30,
      meetingLink: "https://meet.google.com/new"
    });
    setToast("Review session scheduled with Google Meet.");
    load();
  };

  const createPlan = async (event) => {
    event.preventDefault();
    if (!selectedStudent || !planPayload.title.trim()) return;
    await api.post("/collaboration/plans", {
      studentId: selectedStudent,
      title: planPayload.title,
      focusCompany: planPayload.focusCompany,
      summary: planPayload.summary,
      milestones: parseMilestones(planPayload.milestones)
    });
    setPlanPayload({ title: "", focusCompany: "", summary: "", milestones: "" });
    setToast("Shared preparation plan published.");
    load();
  };

  return (
    <>
      <div className="page-title row">
        <div>
          <h1>Mentor Collaboration Workspace</h1>
          <p>Track at-risk students, share preparation plans, assign tasks, review readiness, and keep sessions action-oriented.</p>
        </div>
        <Link className="primary-button" to="/chat">
          <MessageSquare size={17} /> Open messages
        </Link>
      </div>

      <div className="metric-grid">
        <article className="metric-card"><span><Users size={14} /> Assigned students</span><strong>{students.length}</strong></article>
        <article className="metric-card"><span><TrendingUp size={14} /> Average readiness</span><strong>{avgReadiness}%</strong></article>
        <article className="metric-card"><span><CalendarPlus size={14} /> Pending meetings</span><strong>{meetings.filter((item) => item.status !== "completed").length}</strong></article>
        <article className="metric-card"><span><ClipboardList size={14} /> Active plans</span><strong>{plans.filter((item) => item.status === "active").length}</strong></article>
      </div>

      <div className="dashboard-grid">
        <section className="panel wide">
          <div className="row" style={{ marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Student Readiness Queue</h2>
            <div className="search-box compact-search">
              <Search size={16} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search students" />
            </div>
          </div>

          {!filteredStudents.length ? (
            <EmptyState title="No students found" message="Try a different search or wait for student assignments to sync." />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Target Role</th>
                  <th>Readiness</th>
                  <th>Resume</th>
                  <th>Weak Topics</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student._id}>
                    <td>
                      <div className="student-cell">
                        <div className="student-avatar">{student.userId?.name?.[0]?.toUpperCase() || "S"}</div>
                        <div>
                          <strong>{student.userId?.name || "Unknown"}</strong>
                          <div className="muted" style={{ fontSize: 12 }}>{student.userId?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{student.targetRole || <span className="muted">Not set</span>}</td>
                    <td>
                      <div className="table-progress">
                        <div className="table-progress-bar" style={{ width: `${student.readinessScore || 0}%`, background: (student.readinessScore || 0) >= 70 ? "#0f766e" : (student.readinessScore || 0) >= 50 ? "#d97706" : "#dc2626" }} />
                        <span>{student.readinessScore || 0}%</span>
                      </div>
                    </td>
                    <td>{student.resumeScore || 0}%</td>
                    <td>{(student.weakTopics || []).slice(0, 3).join(", ") || "No flagged topics"}</td>
                    <td>
                      <button className="secondary-button" onClick={() => setSelectedStudent(student._id)}>
                        <StickyNote size={14} /> Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="panel">
          <h2>Mentor Actions</h2>
          <form className="stack" onSubmit={addNote}>
            <label>
              Student
              <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
                <option value="">Select student</option>
                {students.map((student) => (
                  <option value={student._id} key={student._id}>{student.userId?.name || student.userId?.email}</option>
                ))}
              </select>
            </label>
            <label>
              Mentor note
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Focus on DBMS indexing and reduce long-winded openings in HR answers." />
            </label>
            <button className="primary-button"><StickyNote size={16} /> Share note</button>
          </form>
        </section>

        <section className="panel">
          <h2>Schedule Improvement Review</h2>
          <form className="stack" onSubmit={requestMeeting}>
            <label>
              Student
              <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
                <option value="">Select student</option>
                {students.map((student) => (
                  <option value={student._id} key={student._id}>{student.userId?.name || student.userId?.email}</option>
                ))}
              </select>
            </label>
            <label>Review topic<input value={meetingPayload.topic} onChange={(e) => setMeetingPayload((prev) => ({ ...prev, topic: e.target.value }))} placeholder="Student improvement review" /></label>
            <label>When to schedule<input type="datetime-local" value={meetingPayload.scheduledAt} onChange={(e) => setMeetingPayload((prev) => ({ ...prev, scheduledAt: e.target.value }))} /></label>
            <label>Duration<select value={meetingPayload.durationMinutes} onChange={(e) => setMeetingPayload((prev) => ({ ...prev, durationMinutes: Number(e.target.value) }))}><option value={15}>15 minutes</option><option value={30}>30 minutes</option><option value={45}>45 minutes</option><option value={60}>60 minutes</option></select></label>
            <label className="full">Agenda<textarea value={meetingPayload.agenda} onChange={(e) => setMeetingPayload((prev) => ({ ...prev, agenda: e.target.value }))} placeholder="Discuss weak areas, recent interview scores, and next-week practice plan." /></label>
            <label>Google Meet link<input value={meetingPayload.meetingLink} onChange={(e) => setMeetingPayload((prev) => ({ ...prev, meetingLink: e.target.value }))} placeholder="https://meet.google.com/..." /></label>
            <div className="button-row">
              <a className="secondary-button" href="https://meet.google.com/new" target="_blank" rel="noreferrer"><Video size={16} /> Create GMeet</a>
              <button className="primary-button"><CalendarPlus size={16} /> Schedule review</button>
            </div>
            <p className="muted">Create a Google Meet in a new tab, paste the generated link here, then schedule the review so both sides can join from the dashboard.</p>
          </form>
        </section>

        <section className="panel">
          <h2>Assign Custom Task</h2>
          <form className="stack" onSubmit={assignTask}>
            <label>Task title<input value={taskPayload.title} onChange={(e) => setTaskPayload((prev) => ({ ...prev, title: e.target.value }))} placeholder="Rework one ATS project bullet with metrics" /></label>
            <label>Category<select value={taskPayload.category} onChange={(e) => setTaskPayload((prev) => ({ ...prev, category: e.target.value }))}><option>coding</option><option>aptitude</option><option>resume</option><option>hr</option><option>project</option><option>system-design</option></select></label>
            <label>Priority<select value={taskPayload.priority} onChange={(e) => setTaskPayload((prev) => ({ ...prev, priority: e.target.value }))}><option>low</option><option>medium</option><option>high</option></select></label>
            <label>Deadline<input type="date" value={taskPayload.deadline} onChange={(e) => setTaskPayload((prev) => ({ ...prev, deadline: e.target.value }))} /></label>
            <button className="primary-button"><ClipboardList size={16} /> Assign task</button>
          </form>
        </section>

        <section className="panel wide">
          <h2>Shared Preparation Plans</h2>
          <form className="grid-form mentor-plan-form" onSubmit={createPlan}>
            <label>Plan title<input value={planPayload.title} onChange={(e) => setPlanPayload((prev) => ({ ...prev, title: e.target.value }))} placeholder="4-week Amazon SDE prep plan" /></label>
            <label>Focus company<input value={planPayload.focusCompany} onChange={(e) => setPlanPayload((prev) => ({ ...prev, focusCompany: e.target.value }))} placeholder="Amazon" /></label>
            <label className="full">Plan summary<textarea value={planPayload.summary} onChange={(e) => setPlanPayload((prev) => ({ ...prev, summary: e.target.value }))} placeholder="Tighten DSA, strengthen ownership stories, and increase ATS alignment for backend roles." /></label>
            <label className="full">Milestones<textarea value={planPayload.milestones} onChange={(e) => setPlanPayload((prev) => ({ ...prev, milestones: e.target.value }))} placeholder={"Solve 5 interval problems\nRecord 3 HR answers\nRaise ATS score above 72"} /></label>
            <button className="primary-button">Publish shared plan</button>
          </form>

          <div className="stack" style={{ marginTop: 18 }}>
            {plans.slice(0, 4).map((plan) => (
              <div className="mentor-note-preview" key={plan._id}>
                <div className="row">
                  <strong>{plan.title}</strong>
                  <span className={`status-pill status-${plan.status}`}>{plan.status}</span>
                </div>
                <p>{plan.summary}</p>
                <small>{plan.studentId?.userId?.name || "Student"} · {plan.focusCompany || "General placement plan"}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Students Needing Attention</h2>
          {atRiskStudents.length ? (
            atRiskStudents.slice(0, 5).map((student) => (
              <div className="mini-interview-card" key={student._id}>
                <strong>{student.userId?.name}</strong>
                <p className="muted">{student.readinessScore || 0}% readiness · {(student.weakTopics || []).join(", ") || "No weak topics logged"}</p>
              </div>
            ))
          ) : (
            <p className="muted">No students are currently below the risk threshold.</p>
          )}
        </section>

        <section className="panel">
          <h2>Upcoming Check-ins</h2>
          {meetings.length ? meetings.slice(0, 6).map((meeting) => (
            <div className="mini-interview-card" key={meeting._id}>
              <div className="mic-header">
                <strong>{meeting.topic}</strong>
                <span className={`status-pill status-${meeting.status}`}>{meeting.status}</span>
              </div>
              <p className="muted">{meeting.studentId?.userId?.name || "Student"} · {meeting.scheduledAt ? formatDistanceToNow(meeting.scheduledAt) : "not scheduled"} · {meeting.durationMinutes || 30} min</p>
              {meeting.agenda && <p className="muted">{meeting.agenda}</p>}
              {meeting.meetingLink && (
                <a className="secondary-button" href={meeting.meetingLink} target="_blank" rel="noreferrer">
                  <ExternalLink size={14} /> Join Google Meet
                </a>
              )}
            </div>
          )) : <p className="muted">No check-ins yet.</p>}
        </section>

        <section className="panel wide">
          <h2>Recent Mentor Activity</h2>
          {activities.length ? (
            <div className="timeline-list compact-timeline">
              {activities.slice(0, 10).map((activity) => (
                <div className="timeline-item" key={activity._id}>
                  <span className="timeline-dot" />
                  <div>
                    <strong>{activity.title}</strong>
                    <p>{activity.message}</p>
                    <small>{formatDistanceToNow(activity.createdAt)}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Actions from notes, meetings, plans, and assigned tasks will appear here.</p>
          )}
        </section>
      </div>

      <NotificationToast message={toast} />
    </>
  );
}
