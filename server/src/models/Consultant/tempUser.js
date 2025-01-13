import mongoose from "mongoose";

const TempUserSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  verificationToken: { type: String, required: true },
  emailVerified: { type: Boolean, default: false },
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true,
    default: null
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId && !this.facebookId;
    }
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    expires: 24 * 60 * 60 // Auto-delete after 24 hours if not verified
  }
});

const TempConsultant = mongoose.model('TempUser', TempUserSchema);
export default TempConsultant;
