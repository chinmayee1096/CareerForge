import mongoose from "mongoose";

const roundSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    roundType: {
      type: String,
      enum: ["application", "oa", "technical", "hr", "offer", "other"],
      default: "other"
    },
    status: {
      type: String,
      enum: ["not-started", "scheduled", "cleared", "rejected", "waiting", "completed"],
      default: "not-started"
    },
    scheduledAt: Date,
    completedAt: Date,
    notes: String
  },
  { _id: true, timestamps: true }
);

const timelineEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    status: { type: String, trim: true, default: "" },
    happenedAt: { type: Date, default: Date.now },
    notes: { type: String, trim: true, default: "" }
  },
  { _id: true }
);

const placementApplicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", index: true },
    company: { type: String, required: true, trim: true, index: true },
    role: { type: String, required: true, trim: true },
    roleCategory: { type: String, trim: true, default: "" },
    source: { type: String, enum: ["campus", "referral", "off-campus", "internship-cell", "other"], default: "campus" },
    status: {
      type: String,
      enum: ["wishlist", "applied", "oa-cleared", "technical-round", "hr-round", "offer-received", "rejected", "withdrawn"],
      default: "applied",
      index: true
    },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium", index: true },
    location: { type: String, trim: true, default: "" },
    jobType: { type: String, enum: ["internship", "full-time", "contract", "other"], default: "full-time" },
    applicationDate: Date,
    appliedAt: Date,
    interviewDate: Date,
    nextAction: { type: String, trim: true },
    nextActionAt: Date,
    packageLpa: Number,
    rounds: [roundSchema],
    rejectionReason: String,
    notes: String,
    timeline: [timelineEventSchema]
  },
  { timestamps: true }
);

placementApplicationSchema.index({ userId: 1, status: 1, updatedAt: -1 });
placementApplicationSchema.index({ company: "text", role: "text", notes: "text" });

export default mongoose.model("PlacementApplication", placementApplicationSchema);
