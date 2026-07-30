import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    scope: { type: String, enum: ["student", "mentor", "admin"], required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", index: true },
    metrics: {
      readinessScore: Number,
      taskCompletionRate: Number,
      averageInterviewScore: Number,
      weeklyConsistency: Number,
      activeUsers: Number,
      totalUsers: Number
    },
    status: { type: String, enum: ["fresh", "stale"], default: "fresh", index: true }
  },
  { timestamps: true }
);

analyticsSchema.index({ createdAt: -1 });

export default mongoose.model("Analytics", analyticsSchema);
