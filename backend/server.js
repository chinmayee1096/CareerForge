import dotenv from "dotenv";
dotenv.config(); // Load environment variables

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import mongoSanitize from "express-mongo-sanitize";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import placementRoutes from "./routes/placementRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import collaborationRoutes from "./routes/collaborationRoutes.js";
import atsRoutes from "./routes/atsRoutes.js";
import codingRoutes from "./routes/codingRoutes.js";
import prepmateRoutes from "./routes/prepmateRoutes.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import Message from "./models/Message.js";
import Conversation from "./models/Conversation.js";

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173"
].filter(Boolean);

// Socket.IO configuration
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required."));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user || !user.isActive) return next(new Error("User not found."));
    socket.user = user;
    next();
  } catch {
    next(new Error("Invalid token."));
  }
});

// Socket.IO real-time events
io.on("connection", (socket) => {
  const userId = socket.user._id.toString();

  // Join user's personal room
  socket.join(`user:${userId}`);

  // Join conversation rooms
  socket.on("join:conversation", (conversationId) => {
    socket.join(`conversation:${conversationId}`);
  });

  socket.on("leave:conversation", (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });

  // Typing indicators
  socket.on("typing:start", ({ conversationId, receiverId }) => {
    socket.to(`user:${receiverId}`).emit("typing:start", {
      conversationId,
      userId,
      name: socket.user.name
    });
  });

  socket.on("typing:stop", ({ conversationId, receiverId }) => {
    socket.to(`user:${receiverId}`).emit("typing:stop", { conversationId, userId });
  });

  // Real-time message send via socket
  socket.on("message:send", async ({ conversationId, content, receiverId, messageType = "text" }) => {
    try {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: socket.user._id
      });
      if (!conversation) return;

      const message = await Message.create({
        conversationId,
        senderId: socket.user._id,
        receiverId,
        content: content?.trim(),
        messageType
      });

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
        lastMessageAt: new Date(),
        $inc: { [`unreadCount.${receiverId}`]: 1 }
      });

      const populated = await message.populate("senderId", "name email role");

      // Emit to conversation room and receiver's personal room
      io.to(`conversation:${conversationId}`).emit("message:new", populated);
      io.to(`user:${receiverId}`).emit("message:new", populated);
      io.to(`user:${receiverId}`).emit("notification", {
        title: `Message from ${socket.user.name}`,
        message: content?.slice(0, 60),
        type: "message"
      });
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });

  socket.on("disconnect", () => {
    socket.to(`user:${userId}`).emit("user:offline", { userId });
  });
});

// Attach io to request for use in controllers
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// Express middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true
}));
app.use(mongoSanitize());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(apiLimiter);

// Health check
app.get("/api/health", (_req, res) => res.json({
  success: true,
  message: "API is running",
  database: {
    connected: mongoose.connection.readyState === 1,
    state: ["disconnected", "connected", "connecting", "disconnecting"][mongoose.connection.readyState] || "unknown"
  }
}));

app.get("/api", (_req, res) => res.json({
  success: true,
  message: "PlacementAI API is running",
  version: "1.0.0",
  health: "/api/health",
  resources: {
    auth: "/api/auth",
    students: "/api/students",
    tasks: "/api/tasks",
    interviews: "/api/interviews",
    analytics: "/api/analytics",
    applications: "/api/applications",
    collaboration: "/api/collaboration",
    ats: "/api/ats",
    coding: "/api/coding",
    notifications: "/api/notifications"
  }
}));

// DB check middleware
app.use("/api", (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "MongoDB Atlas is not connected. Add MONGO_URI in backend/.env and restart the backend."
    });
  }
  return next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/placement", placementRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/collaboration", collaborationRoutes);
app.use("/api/ats", atsRoutes);
app.use("/api/coding", codingRoutes);
app.use("/api/prepmate", prepmateRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "127.0.0.1";

httpServer.listen(PORT, HOST, async () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
  try {
    await connectDB();
  } catch (error) {
    console.error("Database connection failed:", error.message);
    console.error("Add a valid MongoDB Atlas MONGO_URI in backend/.env, then restart the backend.");
  }
});

export { io };
