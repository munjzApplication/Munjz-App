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

// Indexes for performance
chatMessageSchema.index({ roomName: 1 });
chatMessageSchema.index({ senderId: 1 });
chatMessageSchema.index({ receiverId: 1 });
chatMessageSchema.index({ roomName: 1, createdAt: -1 }); // For fetching recent messages

// Optional: Validate sender and receiver IDs
chatMessageSchema.pre("save", async function (next) {
  try {
    const senderExists = await mongoose.model(this.senderRole).findById(this.senderId);
    const receiverExists = await mongoose.model(this.receiverRole).findById(this.receiverId);
    if (!senderExists || !receiverExists) {
      throw new Error("Invalid sender or receiver ID");
    }
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model("ChatMessage", chatMessageSchema);