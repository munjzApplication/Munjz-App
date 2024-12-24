import mongoose from "mongoose";

const withdrawalRequestSchema = new mongoose.Schema({
  consultantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ConsultantProfile",
    required: true
  },
  amount: { type: Number, required: true },
  // countryCode: { type: String, required: true },
  currency: { type: String, default: "AE" },
  email: { type: String, required: true },
  currentStatus: {
    type: String,
    enum: ["unread", "processing", "completed", "declined"],
    default: "unread"
  },
  time: { type: Date, default: Date.now },
  transferId: { type: String },
  paymentMethod: { type: String }
});

const WithdrawRequest = mongoose.model(
  "WithdrawRequest",
  withdrawalRequestSchema
);

export default WithdrawRequest;
