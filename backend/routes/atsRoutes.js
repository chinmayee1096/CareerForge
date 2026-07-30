import express from "express";
import { body } from "express-validator";
import { analyzeResumeAgainstJob, getAtsHistory, getLatestAtsReview } from "../controllers/atsController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validateMiddleware.js";

const router = express.Router();

router.use(protect, authorize("student"));
router.get("/history", getAtsHistory);
router.get("/latest", getLatestAtsReview);
router.post(
  "/analyze",
  aiLimiter,
  [
    body("resumeText").trim().notEmpty().withMessage("Resume text is required."),
    body("jobDescription").trim().notEmpty().withMessage("Job description is required.")
  ],
  validate,
  analyzeResumeAgainstJob
);

export default router;
