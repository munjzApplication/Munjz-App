import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
  notaryServiceCase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "NotaryService_Case",
    required: true
  },
  notaryServiceID: {
    type: String,
    unique: true
  },
  Documents: {
    type: [
      {
        documentUrl: { type: String, required: true },
        uploadedAt: { type: Date, required: true }
      }
    ],
    required: true,
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("NotaryService_Document", DocumentSchema);
