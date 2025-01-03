import mongoose from "mongoose";

const customerProfileSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  email: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    default: null
  },
  profilePhoto: {
    type: String
  },
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true,
    default: null
  },
  customerUniqueId: {
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
    required: function () {
      return !this.googleId;
    }
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  countryCode: {
    type: String
  },
  location: {
    type: String
  },
  activityStatus: {
    type: Boolean
  },

  isLoggedIn: { type: Boolean, default: false },

  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consultant_Profile',
    }
  ]

});

const customerProfile = mongoose.model(
  "Customer_Profile",
  customerProfileSchema
);
export default customerProfile;
