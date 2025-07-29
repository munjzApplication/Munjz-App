import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    roomName: { type: String, required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    senderRole: {
      type: String,
      enum: ["customer", "consultant", "admin"],
      required: true,
    },
    receiverId: { type: mongoose.Schema.Types.ObjectId, required: true },
    receiverRole: {
      type: String,
      enum: ["customer", "consultant", "admin"],
      required: true,
    },
    messageContent: { type: String, required: true, maxlength: 1000 },
    messageType: {
      type: String,
      enum: ["text", "image", "file", "system"],
      default: "text",
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

chatMessageSchema.index({ roomName: 1 });
chatMessageSchema.index({ roomName: 1, createdAt: -1 });

export default mongoose.model("ChatMessage", chatMessageSchema);