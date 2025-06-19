import mongoose from "mongoose";

const NotaryServiceDocumentSchema = new mongoose.Schema({
  notaryServiceCase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "NotaryService_Case",
    required: true
  },
  documents: [
    {
      documentUrl: { type: String },
    }
  ],
  description: { type: String },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: String, enum: ["customer", "admin"] }, // Who uploaded
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
NotaryServiceDocumentSchema.index({ notaryServiceCase: 1 });
NotaryServiceDocumentSchema.index({ notaryServiceCase: 1, status: 1 });
NotaryServiceDocumentSchema.index({ documentType: 1 });
NotaryServiceDocumentSchema.index({ uploadedAt: -1 });
NotaryServiceDocumentSchema.index({ requestedAt: -1 });
NotaryServiceDocumentSchema.index({ createdAt: -1 });

export default mongoose.model("NotaryService_Document", NotaryServiceDocumentSchema);
