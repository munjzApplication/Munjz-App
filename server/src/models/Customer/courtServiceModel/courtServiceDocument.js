import mongoose from "mongoose";

const CourtServiceDocumentSchema = new mongoose.Schema({
  courtServiceCase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CourtService_Case",
    required: true
  },
  documents: [
    {
      documentUrl: { type: String, required: true },
    }
  ],
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: String, enum: ["customer", "admin"], required: true }, // Who uploaded
  documentType: { 
    type: String, 
    enum: ["initial", "additional", "admin-request", "admin-upload"], 
    required: true 
  },
  status: { type: String, enum: ["pending", "submitted"], default: "submitted" },
  requestedAt: { type: Date }, 
  fulfilledAt: { type: Date }, 
  requestReason: { type: String },

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("CourtService_Document", CourtServiceDocumentSchema);
