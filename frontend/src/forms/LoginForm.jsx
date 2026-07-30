import { useState } from "react";

export default function LoginForm({ onSubmit, loading }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  return (
    <form className="auth-form" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
      <label>Email<input name="email" type="email" value={form.email} onChange={update} required /></label>
      <label>Password<input name="password" type="password" value={form.password} onChange={update} required minLength="6" /></label>
      <button className="primary-button" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
    </form>
  );
}
