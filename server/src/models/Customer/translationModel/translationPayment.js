import mongoose from 'mongoose';

const TranslationPaymentSchema = new mongoose.Schema({
  translationCase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Translation_Details',
    required: true,
  }, 
  amount: {
    type: Number,
    required: true,
  }, 
  paidCurrency: {
    type: String,
    required: true,
  }, 
  paymentDate: { 
    type: Date, 
    required: true 
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'failed', 'unread'],
    default: 'unread',
  }, 
});

export default mongoose.model('Translation_Payment', TranslationPaymentSchema);
