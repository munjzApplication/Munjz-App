import mongoose from "mongoose";

const NotaryCaseSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Customer_Profile',
      required: true
    },
    notaryServiceID: {
      type: String,
      unique: true
    },
    serviceName: {
      type: String,
      require: true
    },
    selectedServiceCountry: {
      type: String,
      require: true
    },
    caseDescription: String,
    totalAmountPaid: { type: Number, default: 0 }, 
    casePaymentStatus: {
      type: String,
      enum: ['free', 'paid'], 
      default: 'free', 
    },
    status: {
      type: String,
      enum: ['submitted', 'working','completed', 'rejected',],

    },
    follower: {
      type: String,
      default: "unread"
    }
  },
  { timestamps: true }
);

export default mongoose.model("NotaryService_Case", NotaryCaseSchema);
