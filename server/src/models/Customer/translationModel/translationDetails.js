import mongoose from "mongoose";

const TranslationDetailsSchema = new mongoose.Schema({
  customerID: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer_Profile',
    required: true
  },
  translationServiceID: {
    type: String,
    required: true,
    unique: true
  },
  documentLanguage: {
    type: String,
    required: true
  },
  translationLanguage: {
    type: String,
    required: true
  },
  casePaymentStatus: {
    type: String,
    enum: ['free', 'paid'], 
    default: 'free', 
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  follower:{
    type: String, 
    default: "unread",
  }
});

export default mongoose.model("Translation_Details", TranslationDetailsSchema);
