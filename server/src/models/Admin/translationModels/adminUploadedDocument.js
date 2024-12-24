import mongoose from 'mongoose';

const AdminUploadedDocumentSchema = new mongoose.Schema({
  caseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Translation_Details', 
    required: true 
  }, 
  documentUrl: { type: String, required: true },
  documentType:{ type: String, require: true },
  description: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Translation_AdminUploadedDocument', AdminUploadedDocumentSchema);
