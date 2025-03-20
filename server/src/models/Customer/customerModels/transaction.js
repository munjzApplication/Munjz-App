import mongoose from "mongoose";

const CustomerTransactionSchema = new mongoose.Schema(
  {
    customerId: {  
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer_Profile", 
      required: true
    },
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      sparse: true,
      refPath: "caseType"
    },
    caseType: {
      type: String,
      sparse: true,
      enum: ["NotaryService_Case", "CourtService_Case", "Translation_Details"]
    },
    serviceType: {
      type: String,
      required: true
    },
    amountPaid: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      required: true
    },
    paymentMethod: {  
      type: String,  
      enum: ["credit_card", "debit_card", "paypal", "bank_transfer"],
      // required: true
    },
    payerId: {
      type: String,
      // required: true
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded","paid"], 
      default: "pending",
      required: true
    },
    paymentDate: { 
      type: Date, 
      default: Date.now 
    }
  },
  {
    timestamps: true
  }
);

const CustomerTransaction = mongoose.model("Customer_Transactions", CustomerTransactionSchema);
export default CustomerTransaction;
