import mongoose from "mongoose";

const progressLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", index: true },
    date: { type: Date, default: Date.now, index: true },
    topicsCompleted: [{ type: String, trim: true }],
    studyMinutes: { type: Number, default: 0 },
    mockInterviewScore: { type: Number, min: 0, max: 100 },
    resumeScore: { type: Number, min: 0, max: 100 },
    consistencyScore: { type: Number, min: 0, max: 100, default: 0 },
    notes: String,
    status: { type: String, enum: ["draft", "submitted", "reviewed"], default: "submitted", index: true }
  },
  { timestamps: true }
);

progressLogSchema.index({ createdAt: -1 });

export default mongoose.model("ProgressLog", progressLogSchema);
