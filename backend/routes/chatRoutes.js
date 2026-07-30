import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getOrCreateConversation,
  listConversations,
  sendMessage,
  getChatHistory,
  markAsRead,
  deleteMessage
} from "../controllers/chatController.js";

const router = express.Router();

router.use(protect);
router.post("/conversations", getOrCreateConversation);
router.get("/conversations", listConversations);
router.post("/messages", sendMessage);
router.get("/conversations/:conversationId/messages", getChatHistory);
router.put("/conversations/:conversationId/read", markAsRead);
router.delete("/messages/:messageId", deleteMessage);

export default router;
