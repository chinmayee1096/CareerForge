import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import RegisterForm from "../forms/RegisterForm.jsx";
import NotificationToast from "../components/NotificationToast.jsx";
import ApiStatus from "../components/ApiStatus.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import FloatingTechBackground from "../components/FloatingTechBackground.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (payload) => {
    try {
      setLoading(true);
      const user = await register(payload);
      navigate(user.role === "mentor" ? "/mentor-dashboard" : "/student-dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page" style={{ position: "relative", overflow: "hidden" }}>
      <FloatingTechBackground density="low" />
      <section className="auth-card wide" style={{ zIndex: 2, position: "relative" }}>
        <h1>Create account</h1>
        <ApiStatus />
        <RegisterForm onSubmit={submit} loading={loading} />
        <Link to="/login">Already have an account?</Link>
      </section>
      <NotificationToast message={error} type="error" />
    </main>
  );
}

