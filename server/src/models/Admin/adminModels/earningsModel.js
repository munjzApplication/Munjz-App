import mongoose from "mongoose";

const earningsSchema = new mongoose.Schema({
  consultantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Consultant",
    required: true,
    // Removed unique: true to allow multiple earnings records for the same consultant
  },
  currency: {
    type: String,
    required: true, // Fixed typo
  },
  totalEarnings: {
    type: Number,
    default: 0,
  },
  serviceName: {
    type: String,
    required: true, // Fixed typo
  },
  reason: {
    type: String,
    required: true, // Fixed typo
  },
  createdAt: {
    type: Date,
    required: true, // Fixed typo
    default: Date.now,
  },
});

const Earnings = mongoose.model("Admin_Earnings", earningsSchema);
export default Earnings;
