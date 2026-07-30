import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, CalendarClock, Plus, Search, Trash2 } from "lucide-react";
import api from "../api/api.js";
import EmptyState from "../components/EmptyState.jsx";
import Loader from "../components/Loader.jsx";
import Modal from "../components/Modal.jsx";
import NotificationToast from "../components/NotificationToast.jsx";
import { formatDistanceToNow } from "../utils/dateUtils.js";

const statusColumns = [
  "applied",
  "oa-cleared",
  "technical-round",
  "hr-round",
  "offer-received",
  "rejected"
];

const emptyForm = {
  company: "",
  role: "",
  roleCategory: "",
  source: "campus",
  jobType: "full-time",
  status: "applied",
  nextAction: "",
  nextActionAt: "",
  interviewDate: "",
  notes: "",
  rejectionReason: ""
};

const prettyStatus = (value) =>
  value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function ApplicationTracker() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [view, setView] = useState("board");
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("updatedAt");
  const [toast, setToast] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [appsRes, analyticsRes] = await Promise.all([
        api.get(`/applications?sort=${sort}`),
        api.get("/applications/analytics")
      ]);
      setApplications(appsRes.data.data || []);
      setAnalytics(analyticsRes.data.data || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [sort]);

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      const blob = [app.company, app.role, app.roleCategory, app.notes].join(" ").toLowerCase();
      const matchesQuery = blob.includes(query.toLowerCase());
      const matchesStatus = status ? app.status === status : true;
      return matchesQuery && matchesStatus;
    });
  }, [applications, query, status]);

  if (loading) return <Loader label="Loading application tracker" />;

  const updateForm = (event) => setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));

  const create = async (event) => {
    event.preventDefault();
    await api.post("/applications", form);
    setForm(emptyForm);
    setOpen(false);
    setToast("Application added to your placement pipeline.");
    load();
  };

  const move = async (app, nextStatus) => {
    await api.put(`/applications/${app._id}`, { status: nextStatus });
    setToast(`${app.company} moved to ${prettyStatus(nextStatus)}.`);
    load();
  };

  const remove = async (app) => {
    await api.delete(`/applications/${app._id}`);
    setToast(`${app.company} removed from the tracker.`);
    load();
  };

  const grouped = statusColumns.map((column) => ({
    status: column,
    items: filtered.filter((app) => app.status === column)
  }));

  return (
    <>
      <div className="page-title row">
        <div>
          <h1>Placement Application Tracker</h1>
          <p>Track OA clears, technical rounds, HR movement, interview dates, and real outcomes across your pipeline.</p>
        </div>
        <button className="primary-button" onClick={() => setOpen(true)}>
          <Plus size={17} /> Add company
        </button>
      </div>

      <section className="hero-panel">
        <div>
          <span className="eyebrow">Pipeline Health</span>
          <h2>{analytics?.successRatio || 0}% success ratio · {analytics?.interviewConversion || 0}% interview conversion</h2>
          <p>These numbers come only from tracked applications and status movement. Nothing is backfilled or simulated.</p>
        </div>
        <div className="application-search">
          <div className="search-box compact-search">
            <Search size={16} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search company, role, notes" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {statusColumns.map((item) => <option key={item} value={item}>{prettyStatus(item)}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="updatedAt">Recently updated</option>
            <option value="company">Company A-Z</option>
          </select>
          <div className="button-row">
            <button className={`secondary-button ${view === "board" ? "selected-toggle" : ""}`} onClick={() => setView("board")}>Board</button>
            <button className={`secondary-button ${view === "timeline" ? "selected-toggle" : ""}`} onClick={() => setView("timeline")}>Timeline</button>
          </div>
        </div>
      </section>

      <div className="metric-grid compact">
        <article className="metric-card"><span>Applications</span><strong>{analytics?.total || 0}</strong></article>
        <article className="metric-card"><span>Interview Conversion</span><strong>{analytics?.interviewConversion || 0}%</strong></article>
        <article className="metric-card"><span>Offer Ratio</span><strong>{analytics?.successRatio || 0}%</strong></article>
      </div>

      <section className="panel">
        <h2>Most Applied Roles</h2>
        {(analytics?.mostAppliedRoles || []).length ? (
          <div className="chip-cloud">
            {analytics.mostAppliedRoles.map((item) => (
              <span className="tag" key={item.role}>{item.role} · {item.count}</span>
            ))}
          </div>
        ) : (
          <p className="muted">Role distribution will appear here once you start tracking applications.</p>
        )}
      </section>

      {filtered.length === 0 ? (
        <section className="panel">
          <EmptyState title="No applications match this view" message="Add companies, refine the search, or switch back to the full pipeline." />
        </section>
      ) : view === "board" ? (
        <div className="kanban-board">
          {grouped.map((column) => (
            <section className="kanban-column" key={column.status}>
              <div className="kanban-column-head">
                <strong>{prettyStatus(column.status)}</strong>
                <span>{column.items.length}</span>
              </div>
              <div className="stack">
                {column.items.map((app) => (
                  <article className="application-card" key={app._id}>
                    <div className="application-card-head">
                      <div>
                        <span className={`status-pill status-${app.status}`}>{prettyStatus(app.status)}</span>
                        <h2>{app.company}</h2>
                        <p>{app.role}</p>
                      </div>
                      <BriefcaseBusiness size={20} />
                    </div>

                    <div className="round-list">
                      {(app.rounds || []).slice(0, 4).map((round) => (
                        <div className="round-line" key={round._id || round.name}>
                          <span>{round.name}</span>
                          <strong>{round.status}</strong>
                        </div>
                      ))}
                    </div>

                    <div className="next-action">
                      <CalendarClock size={15} />
                      <span>{app.nextAction || "No next action saved yet."}</span>
                    </div>

                    <div className="stack">
                      {app.interviewDate && <p className="muted">Interview {formatDistanceToNow(app.interviewDate)}</p>}
                      {app.rejectionReason && <p className="muted">Rejection reason: {app.rejectionReason}</p>}
                    </div>

                    <div className="button-row">
                      <select value={app.status} onChange={(e) => move(app, e.target.value)}>
                        {statusColumns.map((item) => <option key={item} value={item}>{prettyStatus(item)}</option>)}
                      </select>
                      <button className="icon-button" onClick={() => remove(app)} aria-label={`Remove ${app.company}`}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className="panel">
          <div className="timeline-list">
            {filtered.map((app) => (
              <div className="timeline-item timeline-card" key={app._id}>
                <span className="timeline-dot" />
                <div className="stack">
                  <div className="row">
                    <strong>{app.company} · {app.role}</strong>
                    <span className={`status-pill status-${app.status}`}>{prettyStatus(app.status)}</span>
                  </div>
                  <p>{app.nextAction || "No next action yet."}</p>
                  {(app.timeline || []).slice(0, 3).map((event) => (
                    <div className="timeline-subitem" key={event._id || event.title}>
                      <strong>{event.title}</strong>
                      <small>{event.status} · {formatDistanceToNow(event.happenedAt)}</small>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Modal open={open} title="Track a company" onClose={() => setOpen(false)}>
        <form className="grid-form" onSubmit={create}>
          <label>Company<input name="company" value={form.company} onChange={updateForm} required /></label>
          <label>Role<input name="role" value={form.role} onChange={updateForm} required placeholder="Software Engineer Intern" /></label>
          <label>Role category<input name="roleCategory" value={form.roleCategory} onChange={updateForm} placeholder="Frontend, Backend, Analyst" /></label>
          <label>Status<select name="status" value={form.status} onChange={updateForm}>{statusColumns.map((item) => <option key={item} value={item}>{prettyStatus(item)}</option>)}</select></label>
          <label>Source<select name="source" value={form.source} onChange={updateForm}><option>campus</option><option>referral</option><option>off-campus</option><option>internship-cell</option><option>other</option></select></label>
          <label>Job type<select name="jobType" value={form.jobType} onChange={updateForm}><option>full-time</option><option>internship</option><option>contract</option><option>other</option></select></label>
          <label>Next action<input name="nextAction" value={form.nextAction} onChange={updateForm} placeholder="Revise OA questions before the slot" /></label>
          <label>Next action date<input name="nextActionAt" type="date" value={form.nextActionAt} onChange={updateForm} /></label>
          <label>Interview date<input name="interviewDate" type="date" value={form.interviewDate} onChange={updateForm} /></label>
          <label>Rejection reason<input name="rejectionReason" value={form.rejectionReason} onChange={updateForm} placeholder="No feedback, technical gap, communication" /></label>
          <label className="full">Notes<textarea name="notes" value={form.notes} onChange={updateForm} placeholder="Round details, recruiter context, application link, or follow-up notes." /></label>
          <button className="primary-button">Save application</button>
        </form>
      </Modal>

      <NotificationToast message={toast} />
    </>
  );
}
