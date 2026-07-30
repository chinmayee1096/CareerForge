import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, trim: true },
    attachments: [
      {
        url: String,
        publicId: String,
        originalName: String,
        mimeType: String,
        size: Number
      }
    ],
    messageType: { type: String, enum: ["text", "file", "image", "system"], default: "text" },
    isRead: { type: Boolean, default: false, index: true },
    readAt: Date,
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, receiverId: 1 });

export default mongoose.model("Message", messageSchema);
