import mongoose from "mongoose";

const AdditionalDocumentSchema = new mongoose.Schema({
  translationCase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CourtService_Case",
    required: true
  },
  translationServiceID: {
    type: String,
    required: true
  },
  documents: {
    type: [
      {
        documentUrl: { type: String, required: true },
        uploadedAt: { type: Date, required: true }
      }
    ],
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
  requestUpdatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model(
  "Translation_AdditionalDocument",
  AdditionalDocumentSchema
);
