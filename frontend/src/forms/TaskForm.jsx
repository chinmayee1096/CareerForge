import { useState } from "react";

export default function TaskForm({ initial = {}, onSubmit, loading }) {
  const [form, setForm] = useState({
    title: initial.title || "",
    description: initial.description || "",
    category: initial.category || "coding",
    priority: initial.priority || "medium",
    deadline: initial.deadline?.slice(0, 10) || ""
  });
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  return (
    <form className="grid-form" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
      <label>Title<input name="title" value={form.title} onChange={update} required /></label>
      <label>Category<select name="category" value={form.category} onChange={update}><option>coding</option><option>aptitude</option><option>hr</option><option>resume</option><option>project</option></select></label>
      <label>Priority<select name="priority" value={form.priority} onChange={update}><option>low</option><option>medium</option><option>high</option></select></label>
      <label>Deadline<input name="deadline" type="date" value={form.deadline} onChange={update} /></label>
      <label className="full">Description<textarea name="description" value={form.description} onChange={update} /></label>
      <button className="primary-button" disabled={loading}>{loading ? "Saving..." : "Save task"}</button>
    </form>
  );
}
