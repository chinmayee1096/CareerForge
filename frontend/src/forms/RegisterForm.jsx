import { useState } from "react";

export default function RegisterForm({ onSubmit, loading }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student", department: "", semester: 7 });
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  return (
    <form className="auth-form" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
      <label>Name<input name="name" value={form.name} onChange={update} required /></label>
      <label>Email<input name="email" type="email" value={form.email} onChange={update} required /></label>
      <label>Password<input name="password" type="password" value={form.password} onChange={update} required minLength="6" /></label>
      <label>Role<select name="role" value={form.role} onChange={update}><option value="student">Student</option><option value="mentor">Mentor</option></select></label>
      <label>Department<input name="department" value={form.department} onChange={update} /></label>
      <label>Semester<input name="semester" type="number" min="1" max="12" value={form.semester} onChange={update} /></label>
      <button className="primary-button" disabled={loading}>{loading ? "Creating..." : "Create account"}</button>
    </form>
  );
}
