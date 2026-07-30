import { buildAdminAnalytics, buildStudentAnalytics } from "../services/analyticsService.js";

export const studentAnalytics = async (req, res, next) => {
  try {
    res.json({ success: true, data: await buildStudentAnalytics(req.user._id) });
  } catch (error) {
    next(error);
  }
};

export const adminAnalytics = async (req, res, next) => {
  try {
    res.json({ success: true, data: await buildAdminAnalytics() });
  } catch (error) {
    next(error);
  }
};
