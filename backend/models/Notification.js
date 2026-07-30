import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["reminder", "interview", "progress", "feedback", "system", "message", "task", "report", "ats", "coding", "application", "mentor"],
      default: "system"
    },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium", index: true },
    link: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    readAt: Date,
    status: { type: String, enum: ["unread", "read"], default: "unread", index: true }
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ userId: 1, status: 1, priority: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
