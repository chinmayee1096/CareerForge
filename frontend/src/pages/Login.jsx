import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoginForm from "../forms/LoginForm.jsx";
import NotificationToast from "../components/NotificationToast.jsx";
import ApiStatus from "../components/ApiStatus.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import FloatingTechBackground from "../components/FloatingTechBackground.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (payload) => {
    try {
      setLoading(true);
      const user = await login(payload);
      navigate(user.role === "admin" ? "/admin-dashboard" : user.role === "mentor" ? "/mentor-dashboard" : "/student-dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page" style={{ position: "relative", overflow: "hidden" }}>
      <FloatingTechBackground density="low" />
      <section className="auth-card" style={{ zIndex: 2, position: "relative" }}>
        <h1>CareerForge</h1>
        <p>Sign in to continue your placement preparation.</p>
        <ApiStatus />
        <LoginForm onSubmit={submit} loading={loading} />
        <Link to="/register">Create a student or mentor account</Link>
      </section>
      <NotificationToast message={error} type="error" />
    </main>
  );
}

