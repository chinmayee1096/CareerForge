import Activity from "../models/Activity.js";
import ATSReview from "../models/ATSReview.js";
import CodingSubmission from "../models/CodingSubmission.js";
import MeetingRequest from "../models/MeetingRequest.js";
import MentorNote from "../models/MentorNote.js";
import MockInterview from "../models/MockInterview.js";
import PlacementApplication from "../models/PlacementApplication.js";
import PreparationPlan from "../models/PreparationPlan.js";
import ProgressLog from "../models/ProgressLog.js";
import StudentProfile from "../models/StudentProfile.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import { buildPlacementReadiness } from "./readinessService.js";

const average = (values = []) => {
  const valid = values.filter((value) => typeof value === "number" && !Number.isNaN(value));
  return valid.length ? Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length) : 0;
};

export const buildStudentAnalytics = async (userId) => {
  const profile = await StudentProfile.findOne({ userId });

  const [tasks, interviews, logs, recentActivities, applications, mentorNotes, atsReviews, codingSubmissions, activePlan, meetings] = await Promise.all([
    Task.find({ userId }).sort({ createdAt: -1 }).limit(100),
    MockInterview.find({ userId }).sort({ createdAt: -1 }).limit(60),
    ProgressLog.find({ userId }).sort({ date: -1 }).limit(21),
    profile?._id ? Activity.find({ studentId: profile._id }).populate("actorId", "name role").sort("-createdAt").limit(10) : [],
    PlacementApplication.find({ userId }).sort("-updatedAt").limit(30),
    profile?._id
      ? MentorNote.find({ studentId: profile._id, visibility: "shared-with-student" }).populate("mentorId", "name").sort("-createdAt").limit(6)
      : [],
    ATSReview.find({ userId }).sort("-createdAt").limit(8),
    CodingSubmission.find({ userId, mode: "submit" }).populate("problemId", "title difficulty category").sort("-createdAt").limit(20),
    profile?._id ? PreparationPlan.findOne({ studentId: profile._id, status: "active" }).sort("-updatedAt") : null,
    profile?._id
      ? MeetingRequest.find({ studentId: profile._id }).populate("mentorId", "name").sort({ scheduledAt: 1, createdAt: -1 }).limit(6)
      : []
  ]);

  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const taskCompletionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const averageInterviewScore = average(interviews.map((item) => item.overallScore));
  const weeklyConsistency = average(logs.slice(0, 7).map((item) => item.consistencyScore));

  const profileFields = [
    profile?.department,
    profile?.semester,
    profile?.targetRole || profile?.selectedRole,
    profile?.skills?.length,
    profile?.targetCompanies?.length,
    profile?.githubLink,
    profile?.linkedinLink,
    profile?.parsedResume?.rawText || profile?.resumeLink
  ];
  const profileCompletion = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

  const readiness = buildPlacementReadiness({
    profile,
    tasks,
    interviews,
    logs,
    applications,
    atsReviews,
    codingSubmissions
  });

  const activeApplications = readiness.applicationAnalytics.activeCount;
  const offerCount = applications.filter((app) => app.status === "offer-received").length;

  return {
    readinessScore: readiness.overall,
    resumeScore: atsReviews[0]?.metrics?.atsScore ?? profile?.resumeScore ?? 0,
    profileCompletion,
    placementReadiness: readiness.overall,
    readinessBreakdown: readiness.pillars,
    weakTopics: profile?.weakTopics || [],
    weaknessInsights: readiness.weakInsights,
    weeklyTrend: readiness.weeklyTrend,
    heatmap: readiness.heatmap,
    activeApplications,
    offerCount,
    taskCompletionRate,
    averageInterviewScore,
    weeklyConsistency,
    recentLogs: logs,
    recentActivities,
    applications,
    applicationAnalytics: readiness.applicationAnalytics,
    mentorNotes,
    activePlan,
    meetings,
    atsHistory: atsReviews,
    latestAts: atsReviews[0] || null,
    codingSummary: {
      totalSubmissions: codingSubmissions.length,
      acceptedCount: codingSubmissions.filter((item) => item.verdict === "accepted").length,
      averageScore: average(codingSubmissions.map((item) => item.score)),
      averageRuntime: average(codingSubmissions.map((item) => item.runtimeMs)),
      recentSubmissions: codingSubmissions.slice(0, 6)
    }
  };
};

export const buildAdminAnalytics = async () => {
  const [
    totalUsers,
    activeUsers,
    students,
    tasks,
    interviews,
    atsReviews,
    codingSubmissions,
    applications
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    StudentProfile.countDocuments(),
    Task.countDocuments(),
    MockInterview.countDocuments(),
    ATSReview.countDocuments(),
    CodingSubmission.countDocuments({ mode: "submit" }),
    PlacementApplication.countDocuments()
  ]);

  return {
    totalUsers,
    activeUsers,
    students,
    tasks,
    interviews,
    atsReviews,
    codingSubmissions,
    applications
  };
};
