import mongoose from "mongoose";

const AdditionalDocumentSchema = new mongoose.Schema({
  courtServiceCase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CourtService_Case",
    required: true
  },
  Documents: {
    type: [
      {
        documentUrl: { type: String, required: true },
        uploadedAt: { type: Date, required: true }
      }
    ],
    default: [],
    required: true
  },
  requestReason: {
    type: String,
    required: false
  },
  requestStatus: {
    type: String,
    enum: ["unread", "pending", "updated"],
    default: "unread"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model(
  "CourtCase_AdditionalDocument",
  AdditionalDocumentSchema
);
