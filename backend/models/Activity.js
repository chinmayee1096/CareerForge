import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", index: true },
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    type: {
      type: String,
      enum: [
        "profile_updated",
        "resume_reviewed",
        "interview_started",
        "interview_completed",
        "task_created",
        "task_completed",
        "application_updated",
        "mentor_note_added",
        "meeting_requested",
        "meeting_updated",
        "progress_logged",
        "ats_analyzed",
        "coding_submitted",
        "plan_updated"
      ],
      required: true,
      index: true
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

activitySchema.index({ createdAt: -1 });
activitySchema.index({ studentId: 1, createdAt: -1 });
activitySchema.index({ actorId: 1, createdAt: -1 });

export default mongoose.model("Activity", activitySchema);
