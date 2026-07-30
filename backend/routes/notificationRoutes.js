import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getNotifications,
  markNotificationRead,
  markAllRead,
  deleteNotification
} from "../controllers/notificationController.js";

const router = express.Router();

router.use(protect);
router.get("/", getNotifications);
router.put("/:id/read", markNotificationRead);
router.put("/mark-all-read", markAllRead);
router.delete("/:id", deleteNotification);

export default router;
