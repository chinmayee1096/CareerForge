import express from "express";
import { body } from "express-validator";
import {
  createPreparationPlan,
  createMeeting,
  createMentorNote,
  listMeetings,
  listMentorNotes,
  listPreparationPlans,
  updatePreparationPlan,
  updateMeeting
} from "../controllers/collaborationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/notes", listMentorNotes);
router.post(
  "/notes",
  authorize("mentor", "admin"),
  [body("studentId").notEmpty(), body("note").trim().notEmpty()],
  validate,
  createMentorNote
);
router.get("/meetings", listMeetings);
router.post(
  "/meetings",
  [
    body("topic").trim().notEmpty(),
    body("scheduledAt").optional({ checkFalsy: true }).isISO8601(),
    body("durationMinutes").optional().isInt({ min: 15, max: 120 }),
    body("meetingLink").optional({ checkFalsy: true }).isURL()
  ],
  validate,
  createMeeting
);
router.put("/meetings/:id", authorize("mentor", "admin"), updateMeeting);
router.get("/plans", listPreparationPlans);
router.post(
  "/plans",
  authorize("mentor", "admin"),
  [body("studentId").notEmpty(), body("title").trim().notEmpty()],
  validate,
  createPreparationPlan
);
router.put("/plans/:id", authorize("mentor", "admin"), updatePreparationPlan);

export default router;
