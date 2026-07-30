import CodingProblem from "../models/CodingProblem.js";
import CodingSubmission from "../models/CodingSubmission.js";
import StudentProfile from "../models/StudentProfile.js";
import User from "../models/User.js";
import { ensureCodingCatalog } from "../services/codingCatalogService.js";
import { executeSubmission } from "../services/codingExecutionService.js";
import { createNotification } from "../services/notificationService.js";
import { recordActivity } from "../services/activityService.js";

const scoreFromVerdict = (verdict, passedCount, totalCount) => {
  if (!totalCount) return 0;
  if (verdict === "accepted") return 100;
  return Math.max(0, Math.round((passedCount / totalCount) * 100));
};

const calculateStreak = (submissions = []) => {
  const acceptedDates = [...new Set(
    submissions
      .filter((item) => item.verdict === "accepted")
      .map((item) => new Date(item.createdAt).toISOString().slice(0, 10))
  )].sort().reverse();

  if (!acceptedDates.length) return 0;

  let streak = 0;
  let cursor = new Date(`${acceptedDates[0]}T00:00:00Z`).getTime();

  for (const dateKey of acceptedDates) {
    const current = new Date(`${dateKey}T00:00:00Z`).getTime();
    if (current === cursor) {
      streak += 1;
      cursor -= 24 * 60 * 60 * 1000;
    } else if (current < cursor) {
      break;
    }
  }

  return streak;
};

export const listProblems = async (req, res, next) => {
  try {
    await ensureCodingCatalog();
    const query = { isActive: true };
    if (req.query.difficulty) query.difficulty = req.query.difficulty;
    if (req.query.category) query.category = req.query.category;
    if (req.query.company) query.companies = req.query.company;

    const problems = await CodingProblem.find(query)
      .select("-testCases")
      .sort({ order: 1, difficulty: 1, title: 1 });

    res.json({ success: true, data: problems });
  } catch (error) {
    next(error);
  }
};

export const getProblemBySlug = async (req, res, next) => {
  try {
    await ensureCodingCatalog();
    const problem = await CodingProblem.findOne({ slug: req.params.slug, isActive: true });
    if (!problem) {
      res.status(404);
      throw new Error("Coding problem not found.");
    }

    const visibleCases = (problem.testCases || []).filter((testCase) => !testCase.hidden);
    const payload = problem.toObject();
    payload.testCases = visibleCases;
    res.json({ success: true, data: payload });
  } catch (error) {
    next(error);
  }
};

export const runCode = async (req, res, next) => {
  try {
    await ensureCodingCatalog();
    const { problemId, language, code } = req.body;
    const problem = await CodingProblem.findById(problemId);
    if (!problem) {
      res.status(404);
      throw new Error("Coding problem not found.");
    }

    const sampleCases = (problem.testCases || []).filter((item) => !item.hidden);
    const result = await executeSubmission({
      language,
      code,
      testCases: sampleCases,
      timeLimitMs: problem.timeLimitMs
    });

    res.json({
      success: true,
      data: {
        ...result,
        passedCount: result.cases.filter((item) => item.passed).length,
        totalCount: result.cases.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const submitCode = async (req, res, next) => {
  try {
    await ensureCodingCatalog();
    const { problemId, language, code } = req.body;
    const problem = await CodingProblem.findById(problemId);
    if (!problem) {
      res.status(404);
      throw new Error("Coding problem not found.");
    }

    const profile = await StudentProfile.findOne({ userId: req.user._id });
    const result = await executeSubmission({
      language,
      code,
      testCases: problem.testCases || [],
      timeLimitMs: problem.timeLimitMs
    });

    const passedCount = result.cases.filter((item) => item.passed).length;
    const totalCount = result.cases.length;
    const score = scoreFromVerdict(result.verdict, passedCount, totalCount);

    const submission = await CodingSubmission.create({
      userId: req.user._id,
      studentId: profile?._id,
      problemId: problem._id,
      language,
      code,
      mode: "submit",
      verdict: result.verdict,
      score,
      passedCount,
      totalCount,
      runtimeMs: result.runtimeMs,
      cases: result.cases
    });

    const recentSubmissions = await CodingSubmission.find({ userId: req.user._id, mode: "submit" })
      .sort("-createdAt")
      .limit(20);
    const acceptedRate = recentSubmissions.length
      ? Math.round((recentSubmissions.filter((item) => item.verdict === "accepted").length / recentSubmissions.length) * 100)
      : 0;
    const codingReadiness = Math.round((acceptedRate * 0.55) + ((recentSubmissions.reduce((sum, item) => sum + (item.score || 0), 0) / Math.max(recentSubmissions.length, 1)) * 0.45));

    if (profile) {
      profile.codingReadiness = codingReadiness;
      profile.readinessScore = Math.max(profile.readinessScore || 0, Math.round((profile.readinessScore || 0) * 0.7 + codingReadiness * 0.3));
      await profile.save();
    }

    const streak = calculateStreak(recentSubmissions);

    if (result.verdict === "accepted") {
      await createNotification({
        io: req.io,
        userId: req.user._id,
        title: "Coding submission accepted",
        message: `${problem.title} passed all test cases. Current coding streak: ${streak} day${streak === 1 ? "" : "s"}.`,
        type: "coding",
        priority: "medium",
        link: "/coding"
      });
    }

    await recordActivity({
      actorId: req.user._id,
      studentId: profile?._id,
      type: "coding_submitted",
      title: `Coding submission: ${problem.title}`,
      message: `${result.verdict.replace(/-/g, " ")} in ${language}.`,
      metadata: { problemId: problem._id, verdict: result.verdict, score }
    });

    res.status(201).json({
      success: true,
      data: {
        ...submission.toObject(),
        streak
      }
    });
  } catch (error) {
    next(error);
  }
};

export const listSubmissions = async (req, res, next) => {
  try {
    const query = { userId: req.user._id, mode: "submit" };
    if (req.query.problemId) query.problemId = req.query.problemId;

    const submissions = await CodingSubmission.find(query)
      .populate("problemId", "title slug difficulty category")
      .sort("-createdAt")
      .limit(30);

    const streak = calculateStreak(submissions);
    res.json({ success: true, data: submissions, meta: { streak } });
  } catch (error) {
    next(error);
  }
};

export const getLeaderboard = async (req, res, next) => {
  try {
    const windowHours = 24;
    const windowStartedAt = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    const refreshesAt = new Date(windowStartedAt.getTime() + windowHours * 60 * 60 * 1000);
    const grouped = await CodingSubmission.aggregate([
      { $match: { mode: "submit", createdAt: { $gte: windowStartedAt } } },
      {
        $group: {
          _id: "$userId",
          acceptedCount: {
            $sum: {
              $cond: [{ $eq: ["$verdict", "accepted"] }, 1, 0]
            }
          },
          attempts: { $sum: 1 },
          averageScore: { $avg: "$score" },
          bestScore: { $max: "$score" },
          latestSubmissionAt: { $max: "$createdAt" }
        }
      },
      {
        $addFields: {
          scorePercentage: {
            $round: [
              {
                $add: [
                  { $multiply: ["$averageScore", 0.65] },
                  { $multiply: [{ $min: ["$acceptedCount", 5] }, 7] }
                ]
              },
              0
            ]
          }
        }
      },
      { $sort: { scorePercentage: -1, acceptedCount: -1, bestScore: -1, attempts: 1, latestSubmissionAt: 1 } },
      { $limit: 10 }
    ]);

    const users = await User.find({ _id: { $in: grouped.map((item) => item._id) } }).select("name");
    const userMap = new Map(users.map((user) => [user._id.toString(), user.name]));

    const leaderboard = grouped.map((entry, index) => ({
      rank: index + 1,
      userId: entry._id,
      name: userMap.get(entry._id.toString()) || "Student",
      acceptedCount: entry.acceptedCount,
      attempts: entry.attempts,
      averageScore: Math.round(entry.averageScore || 0),
      bestScore: Math.round(entry.bestScore || 0),
      scorePercentage: Math.min(100, Math.round(entry.scorePercentage || 0)),
      latestSubmissionAt: entry.latestSubmissionAt
    }));

    res.json({
      success: true,
      data: leaderboard,
      meta: {
        windowHours,
        windowStartedAt,
        refreshesAt,
        scoring: "Last 24 hours: 65% average score + accepted-submission bonus"
      }
    });
  } catch (error) {
    next(error);
  }
};
