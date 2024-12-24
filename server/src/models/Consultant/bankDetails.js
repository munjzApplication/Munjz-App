import mongoose from 'mongoose';

const bankDetailsSchema = new mongoose.Schema({
  consultantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultant_Profile', 
    required: true,
  },
  holderName: {
    type: String,
    required: true,
    trim: true,
  },
  accountNumber: {
    type: Number, 
    required: true,
    unique: true,
  },
  bankName: {
    type: String,
    required: true,
    trim: true,
  },
  iban: {
    type: String,
    required: true,
    unique: true, 
  },
  creationDate: {
    type: Date,
    default: Date.now,
  },
});

const BankDetails = mongoose.model('Consultant_BankDetails', bankDetailsSchema);
export default BankDetails;
