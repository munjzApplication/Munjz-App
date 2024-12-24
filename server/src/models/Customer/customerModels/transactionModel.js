import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    customerId: {  
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer_Profile", 
      required: true
    },
    consultantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer_Profile",
      required: true
    },
    paymentCurrency: {
      type: String,
      required: true
    },
    paymentTime: {
      type: Date,
      required: true,
      default: Date.now
    },
    paidAmount: {
      type: Number,
      required: true
    },
    paidForService: {
      type: String,
      required: true
    },
    payerID: {
      type: String,
      required: true
    },
    paymentNote: {
      type: String
    },
    paymentStatus: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Transaction = mongoose.model("Consultation_Transaction", TransactionSchema);
export default Transaction;
