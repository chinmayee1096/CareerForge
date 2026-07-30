import PDFDocument from "pdfkit";
import { buildStudentAnalytics } from "./analyticsService.js";
import Feedback from "../models/Feedback.js";

export const buildWeeklyReport = async (userId) => {
  const analytics = await buildStudentAnalytics(userId);
  const feedback = await Feedback.find({}).sort({ createdAt: -1 }).limit(5);
  return {
    generatedAt: new Date(),
    analytics,
    mentorNotes: feedback.map((item) => item.message)
  };
};

export const createReportPdf = async (report) =>
  new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 48 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.fontSize(18).text("Placement Preparation Weekly Report");
    doc.moveDown();
    doc.fontSize(11).text(`Generated: ${report.generatedAt.toDateString()}`);
    doc.text(`Readiness Score: ${report.analytics.readinessScore}`);
    doc.text(`Task Completion: ${report.analytics.taskCompletionRate}%`);
    doc.text(`Average Interview Score: ${report.analytics.averageInterviewScore}`);
    doc.moveDown().text("Mentor Notes:");
    report.mentorNotes.forEach((note) => doc.text(`- ${note}`));
    doc.end();
  });
