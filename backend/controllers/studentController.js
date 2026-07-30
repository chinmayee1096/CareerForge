import StudentProfile from "../models/StudentProfile.js";
import User from "../models/User.js";
import ProgressLog from "../models/ProgressLog.js";
import Notification from "../models/Notification.js";
import { analyzeResume } from "../services/aiService.js";
import { extractResumeTextFromFile } from "../services/documentTextService.js";
import { isStarterTemplateResume, parseResumeText } from "../services/resumeService.js";
import { recordActivity } from "../services/activityService.js";

const starterTemplateFields = [
  "B.Tech Computer Science / AIML, Semester 4",
  "[Project Name] - Built using MERN stack",
  "[Any certifications]"
];

const containsStarterTemplate = (profile) => {
  const parsed = profile?.parsedResume || {};
  const text = [
    parsed.rawText,
    ...(parsed.education || []),
    ...(parsed.skills || []),
    ...(parsed.projects || []),
    ...(parsed.experience || []),
    ...(parsed.certifications || [])
  ].join(" ");
  return starterTemplateFields.some((field) => text.includes(field));
};

export const getProfile = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user._id }).populate("userId", "name email role profilePhoto");
    if (profile && containsStarterTemplate(profile)) {
      profile.parsedResume = undefined;
      profile.resumeMetadata = undefined;
      await profile.save();
    }
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    if (req.body.profilePhoto !== undefined) {
      await User.findByIdAndUpdate(req.user._id, { profilePhoto: req.body.profilePhoto });
    }
    const profile = await StudentProfile.findOneAndUpdate(
      { userId: req.user._id },
      req.body,
      { new: true, upsert: true, runValidators: true }
    ).populate("userId", "name email role profilePhoto");
    await recordActivity({
      actorId: req.user._id,
      studentId: profile._id,
      type: "profile_updated",
      title: "Profile updated",
      message: "Placement goals, skills, or resume details were refreshed."
    });
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const listStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = "", sort = "-createdAt" } = req.query;
    const query = search ? { $or: [{ department: new RegExp(search, "i") }, { targetRole: new RegExp(search, "i") }] } : {};
    const [items, total] = await Promise.all([
      StudentProfile.find(query).populate("userId", "name email").sort(sort).skip((page - 1) * limit).limit(Number(limit)),
      StudentProfile.countDocuments(query)
    ]);
    res.json({ success: true, data: items, meta: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

export const createProgressLog = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user._id });
    const log = await ProgressLog.create({ ...req.body, userId: req.user._id, studentId: profile?._id });
    await recordActivity({
      actorId: req.user._id,
      studentId: profile?._id,
      type: "progress_logged",
      title: "Progress logged",
      message: req.body.notes || `${req.body.studyMinutes || 0} minutes of preparation recorded.`,
      metadata: { studyMinutes: req.body.studyMinutes, topicsCompleted: req.body.topicsCompleted }
    });
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

export const analyzeStudentResume = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user._id });
    const result = await analyzeResume({
      resumeText: req.body.resumeText || profile?.parsedResume?.rawText || profile?.resumeLink || "",
      targetRole: profile?.targetRole,
      skills: profile?.skills
    });
    if (profile) {
      profile.resumeScore = result.score;
      profile.readinessScore = Math.round((profile.readinessScore + result.score) / 2);
      await profile.save();
    }
    await Notification.create({
      userId: req.user._id,
      title: "Resume review completed",
      message: `Your resume is at ${result.score}%. The next edits are ready when you are.`,
      type: "feedback",
      link: "/profile"
    });
    await recordActivity({
      actorId: req.user._id,
      studentId: profile?._id,
      type: "resume_reviewed",
      title: "Resume review completed",
      message: `Resume score updated to ${result.score}%.`,
      metadata: { score: result.score, atsScore: result.atsScore }
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const parseStudentResume = async (req, res, next) => {
  try {
    if (isStarterTemplateResume(req.body.resumeText || "")) {
      res.status(400);
      throw new Error("Please paste your actual resume. The old sample template cannot be used for interviews.");
    }

    const parsedResume = {
      ...parseResumeText(req.body.resumeText || ""),
      ...req.body.manualDetails,
      updatedAt: new Date()
    };
    const profile = await StudentProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        parsedResume,
        resumeMetadata: {
          originalName: req.body.fileName || "pasted-resume.txt",
          mimeType: req.body.mimeType || "text/plain",
          size: req.body.resumeText?.length || 0,
          uploadedAt: new Date()
        },
        skills: parsedResume.skills?.length ? parsedResume.skills : undefined
      },
      { new: true, upsert: true, runValidators: true }
    );
    profile.resumeVersions = [
      {
        label: `Resume v${(profile.resumeVersions?.length || 0) + 1}`,
        fileName: req.body.fileName || "pasted-resume.txt",
        source: "paste",
        rawText: req.body.resumeText || "",
        extractedSkills: parsedResume.skills || [],
        uploadedAt: new Date()
      },
      ...(profile.resumeVersions || [])
    ].slice(0, 10);
    await profile.save();
    res.json({ success: true, data: profile.parsedResume });
  } catch (error) {
    next(error);
  }
};

export const uploadStudentResume = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error("Upload a resume file.");
    }

    const resumeText = await extractResumeTextFromFile({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype
    });

    if (isStarterTemplateResume(resumeText)) {
      res.status(400);
      throw new Error("Please upload your actual resume. The old sample template cannot be used.");
    }

    const parsedResume = {
      ...parseResumeText(resumeText),
      rawText: resumeText,
      parsingStatus: "parsed",
      updatedAt: new Date()
    };

    const profile = await StudentProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        parsedResume,
        resumeMetadata: {
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          uploadedAt: new Date()
        },
        skills: parsedResume.skills?.length ? parsedResume.skills : undefined
      },
      { new: true, upsert: true, runValidators: true }
    );

    profile.resumeVersions = [
      {
        label: `Resume v${(profile.resumeVersions?.length || 0) + 1}`,
        fileName: req.file.originalname,
        source: "upload",
        rawText: resumeText,
        extractedSkills: parsedResume.skills || [],
        uploadedAt: new Date()
      },
      ...(profile.resumeVersions || [])
    ].slice(0, 10);
    await profile.save();

    await recordActivity({
      actorId: req.user._id,
      studentId: profile._id,
      type: "profile_updated",
      title: "Resume uploaded",
      message: `${req.file.originalname} was uploaded and parsed for placement preparation.`,
      metadata: { fileName: req.file.originalname, size: req.file.size }
    });

    res.json({
      success: true,
      data: {
        parsedResume: profile.parsedResume,
        resumeMetadata: profile.resumeMetadata,
        resumeText
      }
    });
  } catch (error) {
    next(error);
  }
};
