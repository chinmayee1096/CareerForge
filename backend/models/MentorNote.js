import mongoose from "mongoose";

const mentorNoteSchema = new mongoose.Schema(
  {
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", required: true, index: true },
    visibility: { type: String, enum: ["mentor-only", "shared-with-student"], default: "shared-with-student" },
    tone: { type: String, enum: ["encouragement", "concern", "next-step", "general"], default: "general" },
    note: { type: String, required: true, trim: true },
    actionItems: [{ type: String, trim: true }],
    reaction: { type: String, enum: ["on-track", "needs-practice", "strong-progress", "blocked", "none"], default: "none" }
  },
  { timestamps: true }
);

mentorNoteSchema.index({ createdAt: -1 });
mentorNoteSchema.index({ studentId: 1, createdAt: -1 });

export default mongoose.model("MentorNote", mentorNoteSchema);
