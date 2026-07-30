import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: "general" },
    status: { type: String, enum: ["pending", "in-progress", "completed"], default: "pending" },
    dueDate: Date,
    note: { type: String, trim: true, default: "" }
  },
  { _id: true }
);

const preparationPlanSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", required: true, index: true },
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    focusCompany: { type: String, trim: true, default: "" },
    targetRole: { type: String, trim: true, default: "" },
    summary: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["active", "paused", "completed"], default: "active", index: true },
    reviewDate: Date,
    milestones: [milestoneSchema]
  },
  { timestamps: true }
);

preparationPlanSchema.index({ studentId: 1, status: 1, updatedAt: -1 });

export default mongoose.model("PreparationPlan", preparationPlanSchema);
