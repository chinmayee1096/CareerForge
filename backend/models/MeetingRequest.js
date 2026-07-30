import mongoose from "mongoose";

const meetingRequestSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", required: true, index: true },
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    topic: { type: String, required: true, trim: true },
    agenda: { type: String, trim: true },
    scheduledAt: Date,
    durationMinutes: { type: Number, default: 30, min: 15, max: 120 },
    meetingLink: { type: String, trim: true, default: "" },
    meetingProvider: { type: String, enum: ["google-meet", "zoom", "teams", "in-person", "other"], default: "google-meet" },
    status: { type: String, enum: ["requested", "scheduled", "completed", "cancelled"], default: "requested", index: true },
    feedback: { type: String, trim: true }
  },
  { timestamps: true }
);

meetingRequestSchema.index({ createdAt: -1 });
meetingRequestSchema.index({ studentId: 1, status: 1 });
meetingRequestSchema.index({ mentorId: 1, scheduledAt: 1 });

export default mongoose.model("MeetingRequest", meetingRequestSchema);
