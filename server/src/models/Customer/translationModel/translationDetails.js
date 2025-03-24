import mongoose from "mongoose";

const TranslationDetailsSchema = new mongoose.Schema({
  customerId: {
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
  totalAmountPaid: { type: Number, default: 0 }, 
  PaymentStatus: {
    type: String,
    enum: ['paid','unpaid'],  
    default: 'paid'   
  },  
  follower:{
    type: String, 
    default: "unread",
  },
  status: {
    type: String,
    enum: ['submitted', 'working','completed', 'rejected',],

  },

},
{ timestamps: true }
);

export default mongoose.model("Translation_Case", TranslationDetailsSchema);
