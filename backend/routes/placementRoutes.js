import express from "express";
import { getPersonalizedGuidance, getPlacementLibrary, updateStudentSkills } from "../controllers/placementController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { aiLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.get("/library", protect, getPlacementLibrary);
router.put("/skills", protect, authorize("student"), updateStudentSkills);
router.get("/guidance", protect, authorize("student"), aiLimiter, getPersonalizedGuidance);

export default router;
