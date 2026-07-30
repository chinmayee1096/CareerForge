import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout.jsx";
import Welcome from "./pages/Welcome.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import MentorDashboard from "./pages/MentorDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Profile from "./pages/Profile.jsx";
import Tasks from "./pages/Tasks.jsx";
import MockInterview from "./pages/MockInterview.jsx";
import Reports from "./pages/Reports.jsx";
import PlacementGuide from "./pages/PlacementGuide.jsx";
import Chat from "./pages/Chat.jsx";
import ApplicationTracker from "./pages/ApplicationTracker.jsx";
import ATSResumeLab from "./pages/ATSResumeLab.jsx";
import CodingArena from "./pages/CodingArena.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";

const Protected = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin-dashboard" replace />;
  if (user.role === "mentor") return <Navigate to="/mentor-dashboard" replace />;
  return <Navigate to="/student-dashboard" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route element={<DashboardLayout />}>
            <Route path="/student" element={<Protected roles={["student"]}><StudentDashboard /></Protected>} />
            <Route path="/student-dashboard" element={<Protected roles={["student"]}><StudentDashboard /></Protected>} />
            <Route path="/mentor" element={<Protected roles={["mentor"]}><MentorDashboard /></Protected>} />
            <Route path="/mentor-dashboard" element={<Protected roles={["mentor"]}><MentorDashboard /></Protected>} />
            <Route path="/admin" element={<Protected roles={["admin"]}><AdminDashboard /></Protected>} />
            <Route path="/admin-dashboard" element={<Protected roles={["admin"]}><AdminDashboard /></Protected>} />
            <Route path="/profile" element={<Protected roles={["student", "mentor"]}><Profile /></Protected>} />
            <Route path="/tasks" element={<Protected><Tasks /></Protected>} />
            <Route path="/interview" element={<Protected roles={["student"]}><MockInterview /></Protected>} />
            <Route path="/guide" element={<Protected roles={["student"]}><PlacementGuide /></Protected>} />
            <Route path="/applications" element={<Protected roles={["student"]}><ApplicationTracker /></Protected>} />
            <Route path="/ats" element={<Protected roles={["student"]}><ATSResumeLab /></Protected>} />
            <Route path="/coding" element={<Protected roles={["student"]}><CodingArena /></Protected>} />
            <Route path="/reports" element={<Protected><Reports /></Protected>} />
            <Route path="/chat" element={<Protected><Chat /></Protected>} />
          </Route>
        </Routes>
      </SocketProvider>
    </AuthProvider>
  );
}
