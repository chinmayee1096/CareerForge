import mongoose from "mongoose";

const submissionCaseSchema = new mongoose.Schema(
  {
    input: { type: String, trim: true, default: "" },
    expectedOutput: { type: String, trim: true, default: "" },
    actualOutput: { type: String, trim: true, default: "" },
    passed: { type: Boolean, default: false },
    runtimeMs: { type: Number, default: 0 },
    hidden: { type: Boolean, default: false },
    message: { type: String, trim: true, default: "" }
  },
  { _id: false }
);

const codingSubmissionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", index: true },
    problemId: { type: mongoose.Schema.Types.ObjectId, ref: "CodingProblem", required: true, index: true },
    language: {
      type: String,
      enum: ["javascript", "python", "java", "cpp"],
      required: true,
      index: true
    },
    code: { type: String, required: true },
    mode: { type: String, enum: ["run", "submit"], default: "submit", index: true },
    verdict: {
      type: String,
      enum: ["accepted", "wrong-answer", "runtime-error", "compile-error", "time-limit", "pending"],
      default: "pending",
      index: true
    },
    score: { type: Number, min: 0, max: 100, default: 0 },
    passedCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 0 },
    runtimeMs: { type: Number, default: 0 },
    cases: [submissionCaseSchema],
    streakRecordedAt: Date
  },
  { timestamps: true }
);

codingSubmissionSchema.index({ userId: 1, createdAt: -1 });
codingSubmissionSchema.index({ problemId: 1, verdict: 1 });

export default mongoose.model("CodingSubmission", codingSubmissionSchema);
