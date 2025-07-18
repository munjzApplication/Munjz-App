import mongoose from "mongoose";

const TranslationDocumentSchema = new mongoose.Schema({
  translationCase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Translation_Details",
    required: true
  },
  documents: [
    {
      documentUrl: { type: String, required: true },
    }
  ],
  description: { type: String },
  noOfPage: {
    type: Number,
    required: false
  },
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

// 🔍 Add indexes for performance
TranslationDocumentSchema.index({ translationCase: 1 });
TranslationDocumentSchema.index({ translationCase: 1, status: 1 });
TranslationDocumentSchema.index({ documentType: 1 });
TranslationDocumentSchema.index({ uploadedAt: -1 });
TranslationDocumentSchema.index({ requestedAt: -1 });
TranslationDocumentSchema.index({ createdAt: -1 });

export default mongoose.model("Translation_Document", TranslationDocumentSchema);
