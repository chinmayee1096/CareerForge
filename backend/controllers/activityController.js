import Activity from "../models/Activity.js";
import StudentProfile from "../models/StudentProfile.js";

const studentScopeFor = async (user) => {
  if (user.role === "student") {
    const profile = await StudentProfile.findOne({ userId: user._id }).select("_id");
    return profile?._id ? { studentId: profile._id } : { actorId: user._id };
  }
  return {};
};

export const listActivities = async (req, res, next) => {
  try {
    const { limit = 20, studentId } = req.query;
    const scope = await studentScopeFor(req.user);
    const query = studentId && req.user.role !== "student" ? { studentId } : scope;
    const items = await Activity.find(query)
      .populate("actorId", "name role")
      .populate("targetUserId", "name role")
      .sort("-createdAt")
      .limit(Math.min(Number(limit), 50));
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};
