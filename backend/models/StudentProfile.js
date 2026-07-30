import mongoose from "mongoose";

const resumeVersionSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true },
    fileName: { type: String, trim: true },
    source: { type: String, enum: ["paste", "upload", "ats-review"], default: "paste" },
    rawText: { type: String, default: "" },
    extractedSkills: [{ type: String, trim: true }],
    atsScore: { type: Number, min: 0, max: 100 },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const studentProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    department: { type: String, trim: true, default: "" },
    semester: { type: Number, min: 1, max: 12 },
    targetRole: { type: String, trim: true, default: "" },
    targetCompanies: [{ type: String, trim: true }],
    skills: [{ type: String, trim: true }],
    weakTopics: [{ type: String, trim: true }],
    resumeLink: String,
    resumeMetadata: {
      originalName: String,
      mimeType: String,
      size: Number,
      uploadedAt: Date
    },
    parsedResume: {
      name: String,
      education: [String],
      skills: [String],
      projects: [String],
      experience: [String],
      certifications: [String],
      rawText: String,
      parsingStatus: { type: String, enum: ["parsed", "needs_manual_review"], default: "needs_manual_review" },
      updatedAt: Date
    },
    selectedCompany: { type: String, default: "TCS", index: true },
    selectedRole: { type: String, default: "" },
    placementSkills: [
      {
        name: String,
        category: String,
        priority: { type: Number, default: 5 },
        custom: { type: Boolean, default: false },
        topics: [String],
        progress: { type: Number, min: 0, max: 100, default: 0 }
      }
    ],
    githubLink: String,
    linkedinLink: String,
    readinessScore: { type: Number, min: 0, max: 100, default: 0 },
    resumeScore: { type: Number, min: 0, max: 100, default: 0 },
    codingReadiness: { type: Number, min: 0, max: 100, default: 0 },
    communicationReadiness: { type: Number, min: 0, max: 100, default: 0 },
    preferredInterviewMode: { type: String, enum: ["voice", "video", "text"], default: "voice" },
    resumeVersions: [resumeVersionSchema],
    readinessBreakdown: {
      interview: { type: Number, min: 0, max: 100, default: 0 },
      aptitude: { type: Number, min: 0, max: 100, default: 0 },
      coding: { type: Number, min: 0, max: 100, default: 0 },
      communication: { type: Number, min: 0, max: 100, default: 0 },
      applications: { type: Number, min: 0, max: 100, default: 0 },
      resume: { type: Number, min: 0, max: 100, default: 0 },
      updatedAt: Date
    }
  },
  { timestamps: true }
);

studentProfileSchema.index({ createdAt: -1 });

export default mongoose.model("StudentProfile", studentProfileSchema);
