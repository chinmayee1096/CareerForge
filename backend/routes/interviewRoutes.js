import express from "express";
import { body } from "express-validator";
import { generateQuestions, listInterviews, submitAnswers, getInterviewById, getImprovementRoadmap } from "../controllers/interviewController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validateMiddleware.js";

const router = express.Router();

router.get("/", protect, listInterviews);
router.get("/roadmap", protect, authorize("student"), aiLimiter, getImprovementRoadmap);
router.get("/:id", protect, getInterviewById);
router.post(
  "/generate",
  protect,
  authorize("student"),
  aiLimiter,
  [
    body("type").optional().isIn(["technical", "aptitude", "coding", "hr", "resume", "behavioral", "system-design"]),
    body("difficulty").optional().isIn(["easy", "medium", "hard", "mixed"]),
    body("numQuestions").optional().isInt({ min: 3, max: 15 })
  ],
  validate,
  generateQuestions
);
router.post("/:id/submit", protect, authorize("student"), aiLimiter, submitAnswers);

export default router;
