import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", required: true, index: true },
    message: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 },
    actionItems: [{ type: String }],
    status: { type: String, enum: ["open", "acknowledged", "resolved"], default: "open", index: true }
  },
  { timestamps: true }
);

feedbackSchema.index({ createdAt: -1 });

export default mongoose.model("Feedback", feedbackSchema);
