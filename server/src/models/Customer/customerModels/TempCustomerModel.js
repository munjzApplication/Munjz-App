import mongoose from "mongoose";

const TempCustomerSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  verificationToken: { type: String, required: true },
  emailVerified: { type: Boolean, default: false },
  createdAt: { 
    type: Date, 
    default: Date.now,
    expires: 24 * 60 * 60 // Auto-delete after 24 hours if not verified
  }
});

const TempCustomer = mongoose.model('TempCustomer', TempCustomerSchema);
export default TempCustomer;
