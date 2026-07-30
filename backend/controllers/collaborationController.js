import MentorNote from "../models/MentorNote.js";
import MeetingRequest from "../models/MeetingRequest.js";
import PreparationPlan from "../models/PreparationPlan.js";
import StudentProfile from "../models/StudentProfile.js";
import { createNotification } from "../services/notificationService.js";
import { recordActivity } from "../services/activityService.js";

export const listMentorNotes = async (req, res, next) => {
  try {
    const profile = req.user.role === "student"
      ? await StudentProfile.findOne({ userId: req.user._id })
      : null;
    const query = req.user.role === "student"
      ? { studentId: profile?._id, visibility: "shared-with-student" }
      : req.query.studentId
        ? { studentId: req.query.studentId }
        : {};

    const notes = await MentorNote.find(query).populate("mentorId", "name email role").sort("-createdAt").limit(30);
    res.json({ success: true, data: notes });
  } catch (error) {
    next(error);
  }
};

export const createMentorNote = async (req, res, next) => {
  try {
    const { studentId, note, actionItems = [], visibility, tone, reaction } = req.body;
    const profile = await StudentProfile.findById(studentId).populate("userId", "name");
    if (!profile) {
      res.status(404);
      throw new Error("Student profile not found.");
    }

    const created = await MentorNote.create({
      mentorId: req.user._id,
      studentId,
      note,
      actionItems,
      visibility,
      tone,
      reaction
    });

    await Promise.all([
      recordActivity({
        actorId: req.user._id,
        studentId,
        targetUserId: profile.userId?._id,
        type: "mentor_note_added",
        title: `Mentor note added for ${profile.userId?.name || "student"}`,
        message: note.slice(0, 140),
        metadata: { noteId: created._id, reaction: created.reaction }
      }),
      visibility !== "mentor-only"
        ? createNotification({
            io: req.io,
            userId: profile.userId?._id,
            title: "Mentor commented on your preparation",
            message: note.slice(0, 120),
            type: "mentor",
            priority: "medium",
            link: "/student"
          })
        : null
    ]);

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
};

export const listMeetings = async (req, res, next) => {
  try {
    const profile = req.user.role === "student"
      ? await StudentProfile.findOne({ userId: req.user._id })
      : null;
    const query = req.user.role === "student"
      ? { studentId: profile?._id }
      : req.query.studentId
        ? { studentId: req.query.studentId }
        : { mentorId: req.user._id };

    const meetings = await MeetingRequest.find(query)
      .populate("requestedBy", "name role")
      .populate("mentorId", "name role")
      .populate({ path: "studentId", populate: { path: "userId", select: "name email" } })
      .sort({ scheduledAt: 1, createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: meetings });
  } catch (error) {
    next(error);
  }
};

export const createMeeting = async (req, res, next) => {
  try {
    const profile = req.user.role === "student"
      ? await StudentProfile.findOne({ userId: req.user._id })
      : await StudentProfile.findById(req.body.studentId);
    if (!profile) {
      res.status(404);
      throw new Error("Student profile not found.");
    }

    const meeting = await MeetingRequest.create({
      ...req.body,
      studentId: profile._id,
      mentorId: req.body.mentorId || profile.mentorId || (req.user.role === "mentor" ? req.user._id : undefined),
      requestedBy: req.user._id,
      status: req.body.scheduledAt ? "scheduled" : req.body.status || "requested",
      meetingProvider: req.body.meetingProvider || "google-meet",
      meetingLink: req.body.meetingLink || "https://meet.google.com/new"
    });

    await recordActivity({
      actorId: req.user._id,
      studentId: profile._id,
      type: "meeting_requested",
      title: `Meeting requested: ${meeting.topic}`,
      message: meeting.agenda,
      metadata: { meetingId: meeting._id, status: meeting.status }
    });

    const recipientId = req.user.role === "student" ? meeting.mentorId : profile.userId;
    if (recipientId) {
      await createNotification({
        io: req.io,
      userId: recipientId,
        title: meeting.scheduledAt ? "Review session scheduled" : "New meeting request",
        message: meeting.scheduledAt
          ? `${meeting.topic} on ${meeting.scheduledAt.toLocaleString("en-IN")}`
          : meeting.topic,
        type: "mentor",
        priority: meeting.scheduledAt ? "high" : "medium",
        link: "/reports"
      });
    }

    res.status(201).json({ success: true, data: meeting });
  } catch (error) {
    next(error);
  }
};

export const updateMeeting = async (req, res, next) => {
  try {
    const meeting = await MeetingRequest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!meeting) {
      res.status(404);
      throw new Error("Meeting not found.");
    }

    await recordActivity({
      actorId: req.user._id,
      studentId: meeting.studentId,
      type: "meeting_updated",
      title: `Meeting ${meeting.status}: ${meeting.topic}`,
      message: meeting.scheduledAt ? `Scheduled for ${meeting.scheduledAt.toLocaleString("en-IN")}` : meeting.feedback,
      metadata: { meetingId: meeting._id, status: meeting.status }
    });

    const fullMeeting = await MeetingRequest.findById(meeting._id).populate({ path: "studentId", populate: { path: "userId", select: "_id" } });
    const recipients = [meeting.mentorId, fullMeeting?.studentId?.userId?._id].filter(Boolean);
    await Promise.all(recipients.map((userId) => createNotification({
      io: req.io,
      userId,
      title: "Meeting updated",
      message: `${meeting.topic} is now ${meeting.status}.`,
      type: "mentor",
      priority: meeting.status === "scheduled" ? "high" : "medium",
      link: "/reports"
    })));

    res.json({ success: true, data: meeting });
  } catch (error) {
    next(error);
  }
};

export const listPreparationPlans = async (req, res, next) => {
  try {
    const profile = req.user.role === "student"
      ? await StudentProfile.findOne({ userId: req.user._id })
      : null;
    const query = req.user.role === "student"
      ? { studentId: profile?._id }
      : req.query.studentId
        ? { studentId: req.query.studentId }
        : { mentorId: req.user._id };

    const plans = await PreparationPlan.find(query)
      .populate("mentorId", "name")
      .populate({ path: "studentId", populate: { path: "userId", select: "name email" } })
      .sort("-updatedAt");

    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

export const createPreparationPlan = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findById(req.body.studentId).populate("userId", "_id name");
    if (!profile) {
      res.status(404);
      throw new Error("Student profile not found.");
    }

    const plan = await PreparationPlan.create({
      ...req.body,
      studentId: profile._id,
      mentorId: req.body.mentorId || profile.mentorId || req.user._id,
      createdBy: req.user._id
    });

    await Promise.all([
      recordActivity({
        actorId: req.user._id,
        studentId: profile._id,
        targetUserId: profile.userId?._id,
        type: "plan_updated",
        title: "Shared preparation plan updated",
        message: plan.summary || plan.title,
        metadata: { planId: plan._id, status: plan.status }
      }),
      createNotification({
        io: req.io,
        userId: profile.userId?._id,
        title: "Preparation plan shared",
        message: `${plan.title} is ready to review with your mentor.`,
        type: "mentor",
        priority: "medium",
        link: "/student"
      })
    ]);

    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

export const updatePreparationPlan = async (req, res, next) => {
  try {
    const plan = await PreparationPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!plan) {
      res.status(404);
      throw new Error("Preparation plan not found.");
    }

    const populatedProfile = await StudentProfile.findById(plan.studentId).populate("userId", "_id");
    await Promise.all([
      recordActivity({
        actorId: req.user._id,
        studentId: plan.studentId,
        targetUserId: populatedProfile?.userId?._id,
        type: "plan_updated",
        title: `Preparation plan ${plan.status}`,
        message: plan.summary || plan.title,
        metadata: { planId: plan._id, status: plan.status }
      }),
      populatedProfile?.userId?._id
        ? createNotification({
            io: req.io,
            userId: populatedProfile.userId._id,
            title: "Preparation plan updated",
            message: `${plan.title} has new milestones or review notes.`,
            type: "mentor",
            priority: "medium",
            link: "/student"
          })
        : null
    ]);

    res.json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};
