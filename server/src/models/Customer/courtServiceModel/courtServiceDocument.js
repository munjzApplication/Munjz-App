import mongoose from "mongoose";

const CourtServiceDocumentSchema = new mongoose.Schema({
  courtServiceCase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CourtService_Case",
    required: true
  },
  documents: [
    {
      documentUrl: { type: String },
    }
  ],
  description: { type: String },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: String, enum: ["customer", "admin"] }, 
  documentType: { 
    type: String, 
    enum: ["initial", "additional", "admin-request", "admin-upload"]
  },
  status: { type: String, enum: ["pending", "submitted"], default: "submitted" },
  requestedAt: { type: Date }, 
  fulfilledAt: { type: Date }, 
  requestReason: { type: String },

  createdAt: { type: Date, default: Date.now }
});

// 🔍 Add indexes for performance
CourtServiceDocumentSchema.index({ courtServiceCase: 1 });
CourtServiceDocumentSchema.index({ courtServiceCase: 1, status: 1 });
CourtServiceDocumentSchema.index({ documentType: 1 });
CourtServiceDocumentSchema.index({ uploadedAt: -1 });
CourtServiceDocumentSchema.index({ requestedAt: -1 });
CourtServiceDocumentSchema.index({ createdAt: -1 });

export default mongoose.model("CourtService_Document", CourtServiceDocumentSchema);
