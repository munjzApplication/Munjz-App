import mongoose from "mongoose";

const consultantProfileSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  email: {
    type: String,
    sparse: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    index: {
      unique: true,
      sparse: true,
      partialFilterExpression: { isDeleted: false }
    }
  },
  profilePhoto: {
    type: String
  },
  phoneNumber: {
    type: String,
    sparse: true,
    index: {
      unique: true,
      sparse: true,
      partialFilterExpression: { isDeleted: false }
    }
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
      return !this.googleId && !this.facebookId && !this.appleId;
    }
  },
  googleId: {
    type: String,
    index: {
      unique: true,
      sparse: true,
      partialFilterExpression: { isDeleted: false }
    }
  },
  facebookId: {
    type: String,
    index: {
      unique: true,
      sparse: true,
      partialFilterExpression: { isDeleted: false }
    }
  },
  appleId: {
    type: String,
    index: {
      unique: true,
      sparse: true,
      partialFilterExpression: { isDeleted: false }
    }
  },
  resetOtpHash: {
    type: String,
    default: undefined
  },
  resetOtpExpiry: {
    type: Date,
    default: undefined
  },

  isBlocked: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
 
  deletedAt: {
    type: Date,
    default: null 
  },

  isOnline: { type: Boolean, default: false },
  isRegistrationComplete: {
  type: Boolean,
  default: false,
},

  personalDetails: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Consultant_PersonalDetails"
  },

  consultationDetails: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ConsultationDetails"
  }
});

const ConsultantProfile = mongoose.model(
  "Consultant_Profile",
  consultantProfileSchema
);

export default ConsultantProfile;
