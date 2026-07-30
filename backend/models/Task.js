import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", index: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, enum: ["aptitude", "coding", "hr", "resume", "project", "system-design", "other"], default: "other" },
    deadline: Date,
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium", index: true },
    status: { type: String, enum: ["pending", "in-progress", "completed", "overdue"], default: "pending", index: true },
    source: { type: String, enum: ["self", "mentor", "ai-plan"], default: "self", index: true },
    tags: [{ type: String, trim: true }],
    reminderAt: Date,
    completedAt: Date
  },
  { timestamps: true }
);

taskSchema.index({ createdAt: -1 });
taskSchema.index({ title: "text", description: "text", category: "text" });

export default mongoose.model("Task", taskSchema);
