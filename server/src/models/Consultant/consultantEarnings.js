import mongoose from "mongoose";

const earningsSchema = new mongoose.Schema({
  consultantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Consultant_Profile",
    required: true,
    unique: true,
  },
  totalEarnings: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    required: true,
    default: "AED",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Earnings = mongoose.model("Consultant_Earnings", earningsSchema);
export default Earnings;