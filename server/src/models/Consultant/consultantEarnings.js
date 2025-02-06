import mongoose from "mongoose";

const earningsSchema = new mongoose.Schema({
  consultantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Consultant_Profile",
    required: true,
    unique: true, // Ensure one record per consultant
  },
  totalEarnings: {
    type: Number,
    default: 0, // Start from zero earnings
  },
  activity: [
    {
      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer_Profile", // Reference to the customer model
        required: true,
      },
      amount: {
        type: Number,
        required: true, // Amount earned in this activity
      },
      currency: {
        type:String,
        require: true,
      },
      status: {
        type: String,
        enum: ["pending", "completed", "cancelled"], // Define allowed statuses
        default: "pending",
      },
      date: {
        type: Date,
        default: Date.now, // Timestamp for the activity
      },
    },
  ],
});

const Earnings = mongoose.model("Consultant_Earnings", earningsSchema);
export default Earnings;
