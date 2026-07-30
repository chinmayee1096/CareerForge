import dotenv from "dotenv";
dotenv.config();

import connectDB from "../config/db.js";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import Task from "../models/Task.js";
import ProgressLog from "../models/ProgressLog.js";
import MockInterview from "../models/MockInterview.js";
import Notification from "../models/Notification.js";

const seed = async () => {
  await connectDB();
  await Promise.all([
    User.deleteMany({ email: /demo\.edu$/ }),
    StudentProfile.deleteMany({ department: "Computer Science" }),
    Task.deleteMany({ title: /Demo/ }),
    ProgressLog.deleteMany({ notes: /Demo/ }),
    MockInterview.deleteMany({ targetRole: "MERN Developer" }),
    Notification.deleteMany({ title: /Demo/ })
  ]);

  const student = await User.create({ name: "Aarav Student", email: "student@demo.edu", password: "password123", role: "student" });
  const mentor = await User.create({ name: "Meera Mentor", email: "mentor@demo.edu", password: "password123", role: "mentor" });
  await User.create({ name: "Admin User", email: "admin@demo.edu", password: "password123", role: "admin" });

  const profile = await StudentProfile.create({
    userId: student._id,
    mentorId: mentor._id,
    department: "Computer Science",
    semester: 7,
    targetRole: "MERN Developer",
    targetCompanies: ["TCS", "Infosys", "Zoho"],
    skills: ["React", "Node.js", "MongoDB"],
    weakTopics: ["Dynamic Programming", "System Design"],
    resumeLink: "https://example.com/resume.pdf",
    githubLink: "https://github.com/demo",
    linkedinLink: "https://linkedin.com/in/demo",
    readinessScore: 76,
    resumeScore: 72
  });

  await Task.insertMany([
    { userId: student._id, studentId: profile._id, title: "Demo DSA practice", category: "coding", priority: "high", status: "in-progress" },
    { userId: student._id, studentId: profile._id, title: "Demo resume update", category: "resume", priority: "medium", status: "pending" },
    { userId: student._id, studentId: profile._id, title: "Demo HR answers", category: "hr", priority: "low", status: "completed", completedAt: new Date() }
  ]);

  await ProgressLog.create({
    userId: student._id,
    studentId: profile._id,
    topicsCompleted: ["Arrays", "React hooks"],
    studyMinutes: 120,
    mockInterviewScore: 78,
    resumeScore: 72,
    consistencyScore: 85,
    notes: "Demo progress log"
  });

  await MockInterview.create({
    userId: student._id,
    studentId: profile._id,
    type: "technical",
    targetRole: "MERN Developer",
    questions: ["Explain JWT authentication.", "How do MongoDB indexes help?"],
    overallScore: 80,
    status: "evaluated"
  });

  await Notification.create({ userId: student._id, title: "Demo reminder", message: "Complete today's coding task.", type: "reminder" });
  console.log("Sample data inserted. Demo password: password123");
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
