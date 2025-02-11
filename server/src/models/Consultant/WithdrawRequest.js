import mongoose from "mongoose";

const withdrawalRequestSchema = new mongoose.Schema({
  consultantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Consultant_Profile",
    required: true
  },
  amount: { type: Number, required: true },
  currentStatus: {
    type: String,
    enum: ["pending", "processing", "completed", "declined"]
  },
  time: { type: Date, default: Date.now },
  transferId: { type: String },
  paymentMethod: { type: String }
});

const WithdrawRequest = mongoose.model(
  "Consultant_WithdrawRequest",
  withdrawalRequestSchema
);

export default WithdrawRequest;
