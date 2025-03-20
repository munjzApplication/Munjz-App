import mongoose from "mongoose";

const additionalPaymentSchema = new mongoose.Schema({
  courtServiceCase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CourtService_Case",
    required: true
  },
  serviceName: {
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
  paymentStatus: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending"
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  paidAt: {
    type: Date
  }
});

export default mongoose.model(
  "courtCase_AdditionalPayment",
  additionalPaymentSchema
);
