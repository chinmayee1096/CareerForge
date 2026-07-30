import MockInterview from "../models/MockInterview.js";
import StudentProfile from "../models/StudentProfile.js";
import CodingSubmission from "../models/CodingSubmission.js";
import { evaluateAnswer, generateInterviewQuestions, generateImprovementRoadmap } from "../services/aiService.js";
import { createNotification } from "../services/notificationService.js";
import { companyInterviewExperiences, companyPreparationPaths } from "../utils/placementData.js";
import { recordActivity } from "../services/activityService.js";

// Helper: flatten previous questions from interview history to avoid repetition
const getPreviousQuestions = (interviews) => {
  const questions = [];
  for (const interview of interviews) {
    questions.push(...(interview.questions || []));
  }
  return [...new Set(questions)];
};

const deriveSkillLevel = ({ readinessScore = 0, averageInterviewScore = 0, codingReadiness = 0 }) => {
  const composite = Math.round((readinessScore * 0.4) + (averageInterviewScore * 0.35) + (codingReadiness * 0.25));
  if (composite >= 75) return "advanced";
  if (composite >= 50) return "developing";
  return "foundation";
};

export const generateQuestions = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user._id });

    if (!profile?.parsedResume?.rawText && !req.body.resumeText) {
      res.status(400);
      throw new Error("Upload or paste your resume before starting an interview.");
    }

    const {
      type = "technical",
      interviewType = "technical",
      mode = "Technical Interview",
      round = "Technical Questions",
      difficulty = "mixed",
      domain = "general",
      numQuestions = 7,
      company = profile?.selectedCompany || "TCS",
      targetRole = profile?.selectedRole || profile?.targetRole || "Software Engineer",
      resumeBasedMode = true
    } = req.body;

    // Fetch recent interview history to avoid question repetition
    const recentInterviews = await MockInterview.find({ userId: req.user._id })
      .select("questions")
      .sort("-createdAt")
      .limit(10);
    const recentScores = await MockInterview.find({ userId: req.user._id, status: "evaluated" })
      .select("overallScore")
      .sort("-createdAt")
      .limit(8);
    const recentCoding = await CodingSubmission.find({ userId: req.user._id, mode: "submit" })
      .select("score")
      .sort("-createdAt")
      .limit(8);

    const previousQuestions = getPreviousQuestions(recentInterviews);
    const companyPath = companyPreparationPaths[company] || companyPreparationPaths.TCS;
    const averageInterviewScore = recentScores.length
      ? Math.round(recentScores.reduce((sum, item) => sum + (item.overallScore || 0), 0) / recentScores.length)
      : 0;
    const codingReadiness = recentCoding.length
      ? Math.round(recentCoding.reduce((sum, item) => sum + (item.score || 0), 0) / recentCoding.length)
      : 0;
    const skillLevel = deriveSkillLevel({
      readinessScore: profile?.readinessScore || 0,
      averageInterviewScore,
      codingReadiness: profile?.codingReadiness || codingReadiness
    });

    const result = await generateInterviewQuestions({
      type,
      interviewType,
      mode,
      round,
      difficulty,
      domain,
      company,
      targetRole,
      numQuestions: Math.min(Math.max(Number(numQuestions), 3), 15),
      skillLevel,
      skills: profile?.placementSkills?.map((s) => s.name) || profile?.skills || [],
      resume: resumeBasedMode ? profile?.parsedResume : {},
      companyFocus: companyPath.focus,
      resumeText: req.body.resumeText || profile?.parsedResume?.rawText || "",
      previousQuestions,
      previousExperiences: companyInterviewExperiences[company] || [],
      weakAreas: profile?.weakTopics || []
    });

    const interview = await MockInterview.create({
      userId: req.user._id,
      studentId: profile?._id,
      type,
      mode,
      round,
      difficulty,
      skillLevel,
      company,
      targetRole,
      previousExperienceHighlights: companyInterviewExperiences[company] || [],
      resumeSnapshot: resumeBasedMode ? profile?.parsedResume : null,
      questions: result.questions
    });

    await recordActivity({
      actorId: req.user._id,
      studentId: profile?._id,
      type: "interview_started",
      title: `${company} ${mode} started`,
      message: `${result.questions.length} questions prepared for ${targetRole}.`,
      metadata: { interviewId: interview._id, company, mode, difficulty }
    });

    res.status(201).json({ success: true, data: interview });
  } catch (error) {
    next(error);
  }
};

export const submitAnswers = async (req, res, next) => {
  try {
    const interview = await MockInterview.findOne({ _id: req.params.id, userId: req.user._id });
    if (!interview) {
      res.status(404);
      throw new Error("Interview not found.");
    }

    const profile = await StudentProfile.findOne({ userId: req.user._id });

    const evaluated = [];
    for (const item of req.body.answers || []) {
      const result = await evaluateAnswer({
        question: item.question,
        answer: item.answer,
        targetRole: interview.targetRole,
        company: interview.company,
        mode: interview.mode,
        resumeContext: {
          skills: interview.resumeSnapshot?.skills || [],
          projects: interview.resumeSnapshot?.projects || []
        },
        deliveryMetrics: { ...(item.voiceMetrics || {}), ...(item.visualMetrics || {}) }
      });
      evaluated.push({
        ...item,
        visualMetrics: item.visualMetrics || {},
        score: result.score,
        feedback: result.feedback,
        followUp: result.followUp,
        metrics: result.metrics
      });
    }

    interview.answers = evaluated;
    const scores = evaluated.map((item) => item.score).filter((s) => typeof s === "number");
    interview.overallScore = scores.length
      ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
      : 0;

    const metricKeys = ["technicalCorrectness", "communication", "confidence", "grammar", "problemSolving", "fluency", "professionalism"];
    interview.evaluation = metricKeys.reduce((acc, key) => {
      const vals = evaluated.map((item) => item.metrics?.[key] || 0);
      acc[key] = vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
      return acc;
    }, {});
    const visualConfidenceAverage = Math.round(
      evaluated.reduce((sum, item) => sum + (item.visualMetrics?.visualConfidenceScore || 0), 0) / Math.max(evaluated.length, 1)
    );
    if (visualConfidenceAverage > 0) {
      interview.evaluation.confidence = Math.round((interview.evaluation.confidence * 0.65) + (visualConfidenceAverage * 0.35));
    }
    interview.deliveryMetrics = {
      wordsPerMinute: Math.round(evaluated.reduce((sum, item) => sum + (item.voiceMetrics?.wordsPerMinute || 0), 0) / Math.max(evaluated.length, 1)),
      fillerWordCount: evaluated.reduce((sum, item) => sum + (item.voiceMetrics?.fillerWordCount || 0), 0),
      confidenceScore: Math.round(evaluated.reduce((sum, item) => sum + (item.voiceMetrics?.confidenceScore || 0), 0) / Math.max(evaluated.length, 1)),
      pauseCount: evaluated.reduce((sum, item) => sum + (item.voiceMetrics?.pauseCount || 0), 0),
      clarityScore: Math.round(evaluated.reduce((sum, item) => sum + (item.voiceMetrics?.clarityScore || 0), 0) / Math.max(evaluated.length, 1)),
      visualConfidenceScore: Math.round(evaluated.reduce((sum, item) => sum + (item.visualMetrics?.visualConfidenceScore || 0), 0) / Math.max(evaluated.length, 1)),
      lightingScore: Math.round(evaluated.reduce((sum, item) => sum + (item.visualMetrics?.lightingScore || 0), 0) / Math.max(evaluated.length, 1)),
      stabilityScore: Math.round(evaluated.reduce((sum, item) => sum + (item.visualMetrics?.stabilityScore || 0), 0) / Math.max(evaluated.length, 1)),
      cameraOnRatio: Math.round(evaluated.reduce((sum, item) => sum + (item.visualMetrics?.cameraOnRatio || 0), 0) / Math.max(evaluated.length, 1))
    };

    // Dynamic strengths and improvements based on evaluation
    const topMetrics = metricKeys
      .map((key) => ({ key, val: interview.evaluation[key] }))
      .sort((a, b) => b.val - a.val);

    interview.strengths = topMetrics.slice(0, 2).map(({ key }) =>
      `Strong ${key.replace(/([A-Z])/g, " $1").toLowerCase()} demonstrated throughout`
    );
    interview.improvements = topMetrics.slice(-2).map(({ key }) =>
      `Improve ${key.replace(/([A-Z])/g, " $1").toLowerCase()} with focused practice`
    );
    interview.suggestions = evaluated.flatMap((item) => [item.feedback, item.followUp].filter(Boolean));
    interview.status = "evaluated";
    await interview.save();

    // Update student weak topics based on low-scoring metrics
    if (profile && interview.overallScore < 65) {
      const weakMetric = topMetrics.slice(-1)[0]?.key;
      if (weakMetric && !profile.weakTopics?.includes(weakMetric)) {
        profile.weakTopics = [...(profile.weakTopics || []), weakMetric].slice(0, 10);
        await profile.save();
      }
    }
    if (profile) {
      profile.communicationReadiness = interview.evaluation.communication || profile.communicationReadiness;
      profile.readinessScore = Math.round(((profile.readinessScore || 0) * 0.7) + (interview.overallScore * 0.3));
      await profile.save();
    }

    // Notification for feedback
    await createNotification({
      io: req.io,
      userId: req.user._id,
      title: "Interview feedback ready",
      message: `${interview.company} ${interview.mode}: ${interview.overallScore}%. Review the notes while the session is fresh.`,
      type: "interview",
      priority: interview.overallScore < 60 ? "high" : "medium",
      link: "/interview"
    });
    await recordActivity({
      actorId: req.user._id,
      studentId: profile?._id,
      type: "interview_completed",
      title: `${interview.company} interview completed`,
      message: `Overall score ${interview.overallScore}% in ${interview.mode}.`,
      metadata: { interviewId: interview._id, score: interview.overallScore, company: interview.company }
    });

    res.json({ success: true, data: interview });
  } catch (error) {
    next(error);
  }
};

export const listInterviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { userId: req.user._id };
    if (status) query.status = status;

    const [items, total] = await Promise.all([
      MockInterview.find(query).sort("-createdAt").skip((page - 1) * limit).limit(Number(limit)),
      MockInterview.countDocuments(query)
    ]);
    res.json({ success: true, data: items, meta: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

export const getInterviewById = async (req, res, next) => {
  try {
    const interview = await MockInterview.findOne({ _id: req.params.id, userId: req.user._id });
    if (!interview) {
      res.status(404);
      throw new Error("Interview not found.");
    }
    res.json({ success: true, data: interview });
  } catch (error) {
    next(error);
  }
};

export const getImprovementRoadmap = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user._id });
    const recentInterviews = await MockInterview.find({ userId: req.user._id })
      .select("overallScore evaluation type company mode createdAt")
      .sort("-createdAt")
      .limit(5);

    const roadmap = await generateImprovementRoadmap({
      interviewHistory: recentInterviews,
      weakAreas: profile?.weakTopics || [],
      targetRole: profile?.selectedRole || profile?.targetRole,
      company: profile?.selectedCompany || "TCS"
    });

    res.json({ success: true, data: roadmap });
  } catch (error) {
    next(error);
  }
};
