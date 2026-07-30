import express from "express";
import { body } from "express-validator";
import {
  getLeaderboard,
  getProblemBySlug,
  listProblems,
  listSubmissions,
  runCode,
  submitCode
} from "../controllers/codingController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";

const router = express.Router();

router.use(protect, authorize("student"));
router.get("/problems", listProblems);
router.get("/problems/:slug", getProblemBySlug);
router.get("/submissions", listSubmissions);
router.get("/leaderboard", getLeaderboard);
router.post(
  "/run",
  [
    body("problemId").notEmpty(),
    body("language").isIn(["javascript", "python", "java", "cpp"]),
    body("code").trim().notEmpty()
  ],
  validate,
  runCode
);
router.post(
  "/submit",
  [
    body("problemId").notEmpty(),
    body("language").isIn(["javascript", "python", "java", "cpp"]),
    body("code").trim().notEmpty()
  ],
  validate,
  submitCode
);

export default router;
