import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  notaryServiceCase: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'NotaryService_Case',
    required: true
  },
  notaryServiceID: {
    type: String,
    unique: true,
  },
  amount: { 
    type: Number, 
    required: true 
  },
  paidCurrency: { 
    type: String, 
    required: true 
  },
  serviceName: { 
    type: String, 
    required: true 
  },
  serviceCountry: { 
    type: String, 
    required: true 
  },
  paymentMethod: { 
    type: String, 
    required: true 
  },
  paymentStatus: {
    type: String,
    enum: ['unread', 'pending', 'paid'],
    default: 'unread',
  },
  transactionId: { 
    type: String, 
    required: true 
  },
  paymentDate: { 
    type: Date, 
    required: true 
  },

});
export default mongoose.model('NotaryService_Payment', PaymentSchema);
