import PlacementApplication from "../models/PlacementApplication.js";
import StudentProfile from "../models/StudentProfile.js";
import { createNotification } from "../services/notificationService.js";
import { recordActivity } from "../services/activityService.js";

const defaultRounds = [
  { name: "Application review", roundType: "application", status: "waiting" },
  { name: "Online assessment", roundType: "oa", status: "not-started" },
  { name: "Technical interview", roundType: "technical", status: "not-started" },
  { name: "HR discussion", roundType: "hr", status: "not-started" }
];

const getStudentProfile = (userId) => StudentProfile.findOne({ userId });

const statusLabels = {
  applied: "Applied",
  "oa-cleared": "OA Cleared",
  "technical-round": "Technical Round",
  "hr-round": "HR Round",
  "offer-received": "Offer Received",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  wishlist: "Wishlist"
};

const cleanApplicationPayload = (payload) => {
  const cleaned = { ...payload };
  ["appliedAt", "nextActionAt", "applicationDate", "interviewDate"].forEach((field) => {
    if (cleaned[field] === "") cleaned[field] = undefined;
  });
  return cleaned;
};

const buildTimelineEvent = (title, status, notes = "") => ({
  title,
  status,
  happenedAt: new Date(),
  notes
});

export const listApplications = async (req, res, next) => {
  try {
    const { status, search = "", limit = 50, sort = "updatedAt" } = req.query;
    const query = { userId: req.user._id };
    if (status) query.status = status;
    if (search) query.$text = { $search: search };

    const items = await PlacementApplication.find(query)
      .sort(sort === "company" ? { company: 1 } : { updatedAt: -1 })
      .limit(Math.min(Number(limit), 100));

    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

export const createApplication = async (req, res, next) => {
  try {
    const profile = await getStudentProfile(req.user._id);
    const payload = {
      ...cleanApplicationPayload(req.body),
      userId: req.user._id,
      studentId: profile?._id,
      rounds: req.body.rounds?.length ? req.body.rounds : defaultRounds,
      applicationDate: req.body.applicationDate || req.body.appliedAt || new Date(),
      appliedAt: req.body.status === "applied" && !req.body.appliedAt ? new Date() : req.body.appliedAt,
      timeline: [
        buildTimelineEvent("Application added to tracker", statusLabels[req.body.status || "applied"] || "Applied", req.body.notes || "")
      ]
    };

    const application = await PlacementApplication.create(payload);
    await createNotification({
      io: req.io,
      userId: req.user._id,
      title: "Application added",
      message: `${application.company} is now tracked under ${statusLabels[application.status] || application.status}.`,
      type: "application",
      priority: "medium",
      link: "/applications"
    });
    await recordActivity({
      actorId: req.user._id,
      studentId: profile?._id,
      type: "application_updated",
      title: `${application.company} added to tracker`,
      message: `${application.role} is now tracked as ${application.status}.`,
      metadata: { applicationId: application._id, company: application.company, status: application.status }
    });

    res.status(201).json({ success: true, data: application });
  } catch (error) {
    next(error);
  }
};

export const updateApplication = async (req, res, next) => {
  try {
    const before = await PlacementApplication.findOne({ _id: req.params.id, userId: req.user._id });
    if (!before) {
      res.status(404);
      throw new Error("Application not found.");
    }

    const update = cleanApplicationPayload(req.body);
    if (update.status === "applied" && !before.appliedAt && !update.appliedAt) update.appliedAt = new Date();
    const timeline = [...(before.timeline || [])];
    if (update.status && update.status !== before.status) {
      timeline.unshift(
        buildTimelineEvent(
          `Moved to ${statusLabels[update.status] || update.status}`,
          statusLabels[update.status] || update.status,
          update.rejectionReason || update.nextAction || ""
        )
      );
      update.timeline = timeline.slice(0, 20);
    }

    const application = await PlacementApplication.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      update,
      { new: true, runValidators: true }
    );

    await recordActivity({
      actorId: req.user._id,
      studentId: application.studentId,
      type: "application_updated",
      title: `${application.company} moved to ${application.status}`,
      message: application.nextAction ? `Next step: ${application.nextAction}` : `Updated ${application.role} application.`,
      metadata: { applicationId: application._id, company: application.company, status: application.status }
    });

    if (update.status && update.status !== before.status) {
      await createNotification({
        io: req.io,
        userId: req.user._id,
        title: "Application status updated",
        message: `${application.company} moved to ${statusLabels[application.status] || application.status}.`,
        type: "application",
        priority: ["offer-received", "hr-round", "rejected"].includes(application.status) ? "high" : "medium",
        link: "/applications"
      });
    }

    if (application.interviewDate && application.status !== "rejected") {
      const hoursUntilInterview = (new Date(application.interviewDate).getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilInterview > 0 && hoursUntilInterview <= 48) {
        await createNotification({
          io: req.io,
          userId: req.user._id,
          title: "Upcoming interview round",
          message: `${application.company} has an interview scheduled soon. Review the next action before the slot.`,
          type: "reminder",
          priority: "high",
          link: "/applications"
        });
      }
    }

    res.json({ success: true, data: application });
  } catch (error) {
    next(error);
  }
};

export const getApplicationAnalytics = async (req, res, next) => {
  try {
    const applications = await PlacementApplication.find({ userId: req.user._id }).sort("-updatedAt");
    const applied = applications.filter((item) => item.status !== "wishlist").length;
    const interviews = applications.filter((item) => ["technical-round", "hr-round", "offer-received"].includes(item.status)).length;
    const offers = applications.filter((item) => item.status === "offer-received").length;
    const roleCounts = new Map();
    const statusCounts = new Map();

    for (const app of applications) {
      roleCounts.set(app.role, (roleCounts.get(app.role) || 0) + 1);
      statusCounts.set(app.status, (statusCounts.get(app.status) || 0) + 1);
    }

    res.json({
      success: true,
      data: {
        total: applications.length,
        successRatio: applied ? Math.round((offers / applied) * 100) : 0,
        interviewConversion: applied ? Math.round((interviews / applied) * 100) : 0,
        mostAppliedRoles: [...roleCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([role, count]) => ({ role, count })),
        statusBreakdown: [...statusCounts.entries()].map(([status, count]) => ({ status, count }))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteApplication = async (req, res, next) => {
  try {
    const application = await PlacementApplication.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!application) {
      res.status(404);
      throw new Error("Application not found.");
    }
    res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    next(error);
  }
};
