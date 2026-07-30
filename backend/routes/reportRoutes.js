import express from "express";
import { downloadReport, weeklyReport } from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/weekly", protect, weeklyReport);
router.get("/weekly/download", protect, downloadReport);

export default router;
