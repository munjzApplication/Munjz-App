import mongoose from "mongoose";

const TempCustomerSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  verificationToken: { type: String, required: true },
  emailVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now,  expireAfterSeconds: 60},
});

const TempCustomer = mongoose.model('TempCustomer', TempCustomerSchema);
export default TempCustomer;
