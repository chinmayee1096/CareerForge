import express from "express";
import { adminAnalytics, studentAnalytics } from "../controllers/analyticsController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/student", protect, authorize("student"), studentAnalytics);
router.get("/admin", protect, authorize("admin"), adminAnalytics);

export default router;
