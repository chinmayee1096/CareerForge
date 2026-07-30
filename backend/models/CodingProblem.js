import mongoose from "mongoose";

const codeTemplateSchema = new mongoose.Schema(
  {
    language: {
      type: String,
      enum: ["javascript", "python", "java", "cpp"],
      required: true
    },
    starterCode: { type: String, required: true }
  },
  { _id: false }
);

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String, trim: true, default: "" },
    hidden: { type: Boolean, default: false }
  },
  { _id: false }
);

const codingProblemSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    statement: { type: String, required: true },
    inputFormat: { type: String, trim: true, default: "" },
    outputFormat: { type: String, trim: true, default: "" },
    constraints: [{ type: String, trim: true }],
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "easy", index: true },
    category: { type: String, trim: true, index: true },
    companies: [{ type: String, trim: true, index: true }],
    tags: [{ type: String, trim: true, index: true }],
    timeLimitMs: { type: Number, default: 2500 },
    supportedLanguages: [{ type: String, enum: ["javascript", "python", "java", "cpp"] }],
    templates: [codeTemplateSchema],
    testCases: [testCaseSchema],
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

codingProblemSchema.index({ difficulty: 1, category: 1, isActive: 1 });

export default mongoose.model("CodingProblem", codingProblemSchema);
