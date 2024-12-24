import mongoose from "mongoose";

const AdditionalDocumentSchema = new mongoose.Schema({
  notaryServiceCase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CourtService_Case",
    required: true
  },
  notaryServiceID: {
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
    default: [] 
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
  "NotaryService_AdditionalDocument",
  AdditionalDocumentSchema
);
