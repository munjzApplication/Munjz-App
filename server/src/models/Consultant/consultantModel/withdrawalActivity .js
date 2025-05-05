import mongoose from "mongoose";

const withdrawalActivitySchema = new mongoose.Schema({
  consultantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Consultant_Profile",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    required: true,
    default: "AED",
  },
  status: {
    type: String,
    enum: ["pending","processing", "completed", "cancelled", "declined"],
    default: "pending",
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const WithdrawalActivity = mongoose.model(
  "Withdrawal_Activity",
  withdrawalActivitySchema
);
export default WithdrawalActivity;