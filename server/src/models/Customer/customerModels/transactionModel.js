import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    customerId: {  
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer_Profile", 
      required: true
    },
    currency: {
      type: String,
      required: true
    },
    amountPaid: {
      type: Number,
      required: true
    },
    serviceType: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    payerId: {
      type: String,
      required: true
    },
    purchasedMinutes: {  // New field for minutes purchased
      type: Number,
      required: true
    },
    status: {
      type: String,
      required: true
    },
    paymentDate: { type: Date }
  },
  {
    timestamps: true // Automatically adds createdAt & updatedAt fields
  }
);

const Transaction = mongoose.model("Customer_Transaction", TransactionSchema);
export default Transaction;
