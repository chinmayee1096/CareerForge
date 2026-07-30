import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import mongoose from "mongoose";

// Get or create a conversation between two users
export const getOrCreateConversation = async (req, res, next) => {
  try {
    const { participantId } = req.body;
    if (!participantId) {
      res.status(400);
      throw new Error("participantId is required.");
    }

    const myId = req.user._id;
    const otherId = new mongoose.Types.ObjectId(participantId);

    let conversation = await Conversation.findOne({
      participants: { $all: [myId, otherId] },
      isActive: true
    }).populate("participants", "name email role").populate("lastMessage");

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [myId, otherId],
        unreadCount: { [myId.toString()]: 0, [otherId.toString()]: 0 }
      });
      conversation = await conversation.populate("participants", "name email role");
    }

    res.status(201).json({ success: true, data: conversation });
  } catch (error) {
    next(error);
  }
};

// List all conversations for current user
export const listConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { search = "" } = req.query;

    const conversations = await Conversation.find({
      participants: userId,
      isActive: true
    })
      .populate("participants", "name email role isActive")
      .populate({
        path: "lastMessage",
        select: "content createdAt senderId isRead messageType"
      })
      .sort({ lastMessageAt: -1 })
      .limit(50);

    // Filter by search if provided
    const filtered = search
      ? conversations.filter((conv) =>
          conv.participants.some(
            (p) =>
              p._id.toString() !== userId.toString() &&
              p.name.toLowerCase().includes(search.toLowerCase())
          )
        )
      : conversations;

    res.json({ success: true, data: filtered });
  } catch (error) {
    next(error);
  }
};

// Send a message
export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, content, receiverId, messageType = "text" } = req.body;

    if (!conversationId || (!content && !req.body.attachments?.length)) {
      res.status(400);
      throw new Error("conversationId and content are required.");
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
      isActive: true
    });

    if (!conversation) {
      res.status(404);
      throw new Error("Conversation not found.");
    }

    const targetReceiverId = receiverId ||
      conversation.participants.find((p) => p.toString() !== req.user._id.toString());

    const message = await Message.create({
      conversationId,
      senderId: req.user._id,
      receiverId: targetReceiverId,
      content: content?.trim(),
      messageType,
      attachments: req.body.attachments || []
    });

    // Update conversation metadata
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
      $inc: { [`unreadCount.${targetReceiverId}`]: 1 }
    });

    const populated = await message.populate("senderId", "name email role");

    // Create notification for receiver
    await Notification.create({
      userId: targetReceiverId,
      title: `New message from ${req.user.name}`,
      message: content?.slice(0, 80) || "Sent an attachment",
      type: "message"
    });

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// Fetch chat history for a conversation
export const getChatHistory = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 40 } = req.query;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    });

    if (!conversation) {
      res.status(404);
      throw new Error("Conversation not found.");
    }

    const messages = await Message.find({
      conversationId,
      isDeleted: false
    })
      .populate("senderId", "name email role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: messages.reverse() });
  } catch (error) {
    next(error);
  }
};

// Mark messages as read
export const markAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    await Message.updateMany(
      { conversationId, receiverId: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    await Conversation.findByIdAndUpdate(conversationId, {
      [`unreadCount.${userId}`]: 0
    });

    res.json({ success: true, message: "Messages marked as read." });
  } catch (error) {
    next(error);
  }
};

// Delete a message (soft delete)
export const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findOne({
      _id: req.params.messageId,
      senderId: req.user._id
    });

    if (!message) {
      res.status(404);
      throw new Error("Message not found or unauthorized.");
    }

    message.isDeleted = true;
    await message.save();

    res.json({ success: true, message: "Message deleted." });
  } catch (error) {
    next(error);
  }
};
