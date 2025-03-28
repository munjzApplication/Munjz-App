import mongoose from "mongoose";


const AdditionalPaymentSchema = new mongoose.Schema(
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
            enum: ["NotaryService_Case", "CourtService_Case", "Translation_Case"]
        },
        serviceType: {
            type: String,
            required: true
        },
        amount: { 
            type: Number,
            required: true
         },
        paidCurrency: { 
            type: String,
            required: true
         },
        requestReason: { 
            type: String, 
            required: true 
        },
        dueDate: {
             type: Date,
             required: true
             },
        status: {
            type: String,
            enum: ["pending", "completed", "rejected"],
            default: "pending"
        },
        
        requestedAt: { type: Date, default: Date.now },
        paymentDate: { 
            type: Date, 
            default: Date.now 
          }
    },
    { timestamps: true }
);

const AdditionalPayment = mongoose.model("Customer_AdditionaTransactions", AdditionalPaymentSchema);
export default AdditionalPayment;
