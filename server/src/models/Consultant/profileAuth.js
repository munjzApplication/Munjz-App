import mongoose from "mongoose";


const googleAuthProfileSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  profilePhoto: {
    type: String
  },
  creationDate: {
    type: Date,
    default: Date.now
  }
});

const GoogleAuthProfile = mongoose.model(
  "GoogleAuthProfile",
  googleAuthProfileSchema
);

export default GoogleAuthProfile;
