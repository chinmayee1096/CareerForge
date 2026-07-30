import mongoose from "mongoose";

const keywordGroupSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true },
    matched: [{ type: String, trim: true }],
    missing: [{ type: String, trim: true }],
    score: { type: Number, min: 0, max: 100, default: 0 }
  },
  { _id: false }
);

const atsReviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", index: true },
    versionNumber: { type: Number, default: 1 },
    company: { type: String, trim: true, default: "" },
    targetRole: { type: String, trim: true, default: "" },
    fileName: { type: String, trim: true, default: "resume.txt" },
    resumeText: { type: String, required: true },
    jobDescription: { type: String, required: true },
    extractedSkills: [{ type: String, trim: true }],
    matchedKeywords: [{ type: String, trim: true }],
    missingKeywords: [{ type: String, trim: true }],
    missingSkills: [{ type: String, trim: true }],
    formattingIssues: [{ type: String, trim: true }],
    optimizationSuggestions: [{ type: String, trim: true }],
    roleSuggestions: [{ type: String, trim: true }],
    keywordGroups: [keywordGroupSchema],
    metrics: {
      atsScore: { type: Number, min: 0, max: 100, required: true },
      recruiterReadability: { type: Number, min: 0, max: 100, default: 0 },
      keywordMatch: { type: Number, min: 0, max: 100, default: 0 },
      formatting: { type: Number, min: 0, max: 100, default: 0 },
      impact: { type: Number, min: 0, max: 100, default: 0 }
    },
    trend: {
      scoreDelta: { type: Number, default: 0 },
      readabilityDelta: { type: Number, default: 0 },
      keywordDelta: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

atsReviewSchema.index({ userId: 1, createdAt: -1 });
atsReviewSchema.index({ userId: 1, company: 1, targetRole: 1 });

export default mongoose.model("ATSReview", atsReviewSchema);
