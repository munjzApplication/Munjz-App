import mongoose from "mongoose";

const consultantProfileSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  email: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],

  },
  profilePhoto: {
    type: String
  },
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true,
  },
  countryCode: {
    type: String
  },
  consultantUniqueId: {
    type: String,
    unique: true,
    required: true
  },

  emailVerified: {
    type: Boolean,
    sparse: true
  },
  creationDate: {
    type: Date,
    default: Date.now
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId && !this.facebookId  && !this.appleId;;
    }
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  facebookId: {
    type: String,
    unique: true,
    sparse: true
  },
  appleId: {
    type: String,
    unique: true,
    sparse: true
  },
  resetOtpHash: {
    type: String,
    default: undefined,
  },
  resetOtpExpiry: {
    type: Date,
    default: undefined,
  },

  isBlocked: {
    type: Boolean,
    default: false
  },
    // ✅ Soft Delete Field
    deletedAt: {
      type: Date,
      default: null // NULL means the account is active
    }

});

const ConsultantProfile = mongoose.model(
  "Consultant_Profile",
  consultantProfileSchema
);

export default ConsultantProfile;
