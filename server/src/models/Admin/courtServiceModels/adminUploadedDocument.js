import mongoose from 'mongoose';

const AdminUploadedDocumentSchema = new mongoose.Schema({
  caseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'CourtService_Case', 
    required: true 
  }, 
  documentUrl: { type: String, required: true },
  description: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

export default mongoose.model('CourtService_AdminUploadedDocument', AdminUploadedDocumentSchema);
