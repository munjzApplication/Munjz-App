import mongoose from 'mongoose';

const TranslationRequestSchema = new mongoose.Schema({
  TranslationID: {
    type: String,
    unique: true,
  },
  selectedServiceCountry: String,
  requesterEmail: String,

}, { timestamps: true });

export default mongoose.model('Translation_Request', TranslationRequestSchema);
