import express from "express";
import { listActivities } from "../controllers/activityController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, listActivities);

export default router;
