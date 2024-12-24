import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
  courtServiceCase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CourtService_Case",
    required: true
  },
  courtServiceID: {
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
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("CourtService_Document", DocumentSchema);
