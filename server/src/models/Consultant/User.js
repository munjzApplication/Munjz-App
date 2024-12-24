import mongoose from "mongoose";

const consultantProfileSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  email: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]
  },
  profilePhoto: {
    type: String
  },
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  consultantUniqueId: {
    type: String,
    unique: true,
    required: true
  },

  emailVerified: {
    type: Boolean,
    default: false,
    sparse: true
  },
  creationDate: {
    type: Date,
    default: Date.now
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId && !this.facebookId;
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
  }
});

const ConsultantProfile = mongoose.model(
  "Consultant_Profile",
  consultantProfileSchema
);

export default ConsultantProfile;
