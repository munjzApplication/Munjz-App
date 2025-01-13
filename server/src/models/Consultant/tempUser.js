import mongoose from "mongoose";

const TempUserSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  verificationToken: { type: String, required: true },
  emailVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now,  expireAfterSeconds: 60},
});

const TempConsultant = mongoose.model('TempConsultant', TempUserSchema);
export default TempConsultant;
