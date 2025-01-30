import mongoose from "mongoose";

const WalletSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer_Profile",
    required: true,
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
  },
  walletActivity: [
    {
      status: { type: String, enum: ["+", "-"], required: true }, // "+" for credit, "-" for debit
      minute: { type: Number, required: true },
      time: { type: Date, default: Date.now }, // Store timestamp of activity
    },
  ],
});

const Wallet = mongoose.model("Customer_Wallet", WalletSchema);
export default Wallet;
