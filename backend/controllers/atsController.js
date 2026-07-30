import ATSReview from "../models/ATSReview.js";
import StudentProfile from "../models/StudentProfile.js";
import { analyzeAtsResume } from "../services/atsService.js";
import { createNotification } from "../services/notificationService.js";
import { recordActivity } from "../services/activityService.js";

const limitVersions = (versions = []) => versions.slice(0, 10);

export const analyzeResumeAgainstJob = async (req, res, next) => {
  try {
    const {
      resumeText = "",
      jobDescription = "",
      targetRole = "",
      company = "",
      fileName = "resume.txt"
    } = req.body;

    if (!resumeText.trim() || !jobDescription.trim()) {
      res.status(400);
      throw new Error("Resume text and job description are both required.");
    }

    const profile = await StudentProfile.findOne({ userId: req.user._id });
    const previousReview = await ATSReview.findOne({ userId: req.user._id }).sort("-createdAt");
    const analysis = analyzeAtsResume({ resumeText, jobDescription, targetRole, company });

    const review = await ATSReview.create({
      userId: req.user._id,
      studentId: profile?._id,
      versionNumber: (previousReview?.versionNumber || 0) + 1,
      company,
      targetRole,
      fileName,
      resumeText,
      jobDescription,
      extractedSkills: analysis.extractedSkills,
      matchedKeywords: analysis.matchedKeywords,
      missingKeywords: analysis.missingKeywords,
      missingSkills: analysis.missingSkills,
      formattingIssues: analysis.formattingIssues,
      optimizationSuggestions: analysis.optimizationSuggestions,
      roleSuggestions: analysis.roleSuggestions,
      keywordGroups: analysis.keywordGroups,
      metrics: analysis.metrics,
      trend: {
        scoreDelta: analysis.metrics.atsScore - (previousReview?.metrics?.atsScore || 0),
        readabilityDelta: analysis.metrics.recruiterReadability - (previousReview?.metrics?.recruiterReadability || 0),
        keywordDelta: analysis.metrics.keywordMatch - (previousReview?.metrics?.keywordMatch || 0)
      }
    });

    if (profile) {
      profile.resumeScore = analysis.metrics.atsScore;
      profile.skills = analysis.parsedResume.skills?.length ? analysis.parsedResume.skills : profile.skills;
      profile.parsedResume = {
        ...profile.parsedResume,
        ...analysis.parsedResume,
        updatedAt: new Date()
      };
      profile.resumeVersions = limitVersions([
        {
          label: `${company || targetRole || "ATS"} v${review.versionNumber}`,
          fileName,
          source: "ats-review",
          rawText: resumeText,
          extractedSkills: analysis.extractedSkills,
          atsScore: analysis.metrics.atsScore,
          uploadedAt: new Date()
        },
        ...(profile.resumeVersions || [])
      ]);
      await profile.save();
    }

    if (previousReview?.metrics?.atsScore && analysis.metrics.atsScore > previousReview.metrics.atsScore) {
      await createNotification({
        io: req.io,
        userId: req.user._id,
        title: "ATS score improved",
        message: `Your ATS score moved up to ${analysis.metrics.atsScore}% for ${targetRole || "the selected role"}.`,
        type: "ats",
        priority: "medium",
        link: "/ats"
      });
    } else {
      await createNotification({
        io: req.io,
        userId: req.user._id,
        title: "ATS analysis ready",
        message: `Resume reviewed for ${company || targetRole || "the current role"} with an ATS score of ${analysis.metrics.atsScore}%.`,
        type: "ats",
        priority: "medium",
        link: "/ats"
      });
    }

    await recordActivity({
      actorId: req.user._id,
      studentId: profile?._id,
      type: "ats_analyzed",
      title: "ATS resume analysis completed",
      message: `${analysis.metrics.atsScore}% ATS score for ${company || targetRole || "the selected role"}.`,
      metadata: { reviewId: review._id, company, targetRole }
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

export const getAtsHistory = async (req, res, next) => {
  try {
    const reviews = await ATSReview.find({ userId: req.user._id }).sort("-createdAt").limit(20);
    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

export const getLatestAtsReview = async (req, res, next) => {
  try {
    const review = await ATSReview.findOne({ userId: req.user._id }).sort("-createdAt");
    res.json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};
