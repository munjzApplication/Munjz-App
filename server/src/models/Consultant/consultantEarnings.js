import mongoose from "mongoose";

const earningsSchema = new mongoose.Schema({
  consultantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Consultant",
    required: true,
    unique: true, // Ensure one record per consultant
  },
  totalEarnings: {
    type: Number,
    default: 0, // Start from zero earnings
  },
});

const Earnings = mongoose.model("Consultant_Earnings", earningsSchema);
export default Earnings;
