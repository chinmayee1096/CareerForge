import { buildWeeklyReport, createReportPdf } from "../services/reportService.js";

export const weeklyReport = async (req, res, next) => {
  try {
    res.json({ success: true, data: await buildWeeklyReport(req.user._id) });
  } catch (error) {
    next(error);
  }
};

export const downloadReport = async (req, res, next) => {
  try {
    const report = await buildWeeklyReport(req.user._id);
    const pdf = await createReportPdf(report);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=weekly-placement-report.pdf");
    res.send(pdf);
  } catch (error) {
    next(error);
  }
};
