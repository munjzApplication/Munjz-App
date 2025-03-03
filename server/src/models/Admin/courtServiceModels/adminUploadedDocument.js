import mongoose from 'mongoose';

const AdminUploadedDocumentSchema = new mongoose.Schema({
 courtServiceCase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CourtService_Case",
    required: true
  },
  Documents: {
    type: [
      {
        documentUrl: { type: String, required: true },
        description: { type: String, required: true },
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

export default mongoose.model('CourtService_AdminUploadedDocument', AdminUploadedDocumentSchema);
