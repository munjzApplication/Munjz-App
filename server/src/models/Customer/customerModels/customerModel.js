import mongoose from "mongoose";

const customerProfileSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  email: {
    type: String,
    sparse: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    default: null,
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
    default: null,
    index: {
      unique: true,
      sparse: true,
      partialFilterExpression: { isDeleted: false }
    }
  },
  customerUniqueId: {
    type: String,
    unique: true,
    required: true
  },
  emailVerified: {
    type: Boolean,
    default: false, 
  },
  creationDate: {
    type: Date,
    default: Date.now
  },
  password: {
    type: String,
    required: function () {
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
  countryCode: {
    type: String,
    default: null
  },
  country: {
    type: String,
    default: null
  },
  location: {
    type: String
  },
  activityStatus: {
    type: Boolean
  },
  resetOtpHash: {
    type: String, // To store the hashed OTP
 
  },
  resetOtpExpiry: {
    type: Date, // To store the OTP expiration timestamp
   
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  isDeleted: {
  type: Boolean,
  default: false
},

  isLoggedIn: { type: Boolean, default: false },

  isOnline: { type: Boolean, default: false },
  
  // ✅ Soft Delete Field
  deletedAt: {
    type: Date,
    default: null // NULL means the account is active
  },
  isRegistrationComplete: {
    type: Boolean,
    default: false
  },

});

const customerProfile = mongoose.model(
  "Customer_Profile",
  customerProfileSchema
);
export default customerProfile;
