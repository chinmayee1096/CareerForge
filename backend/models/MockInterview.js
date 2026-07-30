import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    question: String,
    answer: String,
    score: { type: Number, min: 0, max: 100 },
    feedback: String,
    followUp: String,
    metrics: {
      technicalCorrectness: Number,
      communication: Number,
      confidence: Number,
      grammar: Number,
      problemSolving: Number,
      fluency: Number,
      professionalism: Number
    },
    voiceMetrics: {
      wordsPerMinute: Number,
      fillerWordCount: Number,
      confidenceScore: Number,
      pauseCount: Number,
      clarityScore: Number
    },
    visualMetrics: {
      visualConfidenceScore: Number,
      lightingScore: Number,
      stabilityScore: Number,
      cameraOnRatio: Number,
      sampleCount: Number
    }
  },
  { _id: false }
);

const mockInterviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", index: true },
    type: { type: String, enum: ["technical", "aptitude", "coding", "hr", "behavioral", "system-design", "resume", "video", "voice", "mcq", "rapid-fire", "group-discussion"], default: "technical", index: true },
    mode: { type: String, default: "Technical Interview", index: true },
    company: { type: String, default: "TCS", index: true },
    round: { type: String, default: "Introduction Round" },
    difficulty: { type: String, enum: ["easy", "medium", "hard", "mixed"], default: "mixed" },
    skillLevel: { type: String, enum: ["foundation", "developing", "advanced"], default: "developing" },
    targetRole: String,
    previousExperienceHighlights: [{ type: String }],
    resumeSnapshot: {
      name: String,
      education: [String],
      skills: [String],
      projects: [String],
      experience: [String],
      certifications: [String]
    },
    questions: [{ type: String }],
    answers: [answerSchema],
    overallScore: { type: Number, min: 0, max: 100, default: 0 },
    evaluation: {
      technicalCorrectness: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 },
      grammar: { type: Number, default: 0 },
      problemSolving: { type: Number, default: 0 },
      fluency: { type: Number, default: 0 },
      professionalism: { type: Number, default: 0 }
    },
    strengths: [String],
    improvements: [String],
    suggestions: [{ type: String }],
    deliveryMetrics: {
      wordsPerMinute: { type: Number, default: 0 },
      fillerWordCount: { type: Number, default: 0 },
      confidenceScore: { type: Number, default: 0 },
      pauseCount: { type: Number, default: 0 },
      clarityScore: { type: Number, default: 0 },
      visualConfidenceScore: { type: Number, default: 0 },
      lightingScore: { type: Number, default: 0 },
      stabilityScore: { type: Number, default: 0 },
      cameraOnRatio: { type: Number, default: 0 }
    },
    status: { type: String, enum: ["generated", "submitted", "evaluated"], default: "generated", index: true }
  },
  { timestamps: true }
);

mockInterviewSchema.index({ createdAt: -1 });

export default mongoose.model("MockInterview", mockInterviewSchema);
