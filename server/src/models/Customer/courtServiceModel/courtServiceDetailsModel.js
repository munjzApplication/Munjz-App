import mongoose from "mongoose";

const CourtCaseSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer_Profile",
      required: true
    },

    courtServiceID: {
      type: String,
      unique: true
    },
    serviceName: {
      type: String,
      require: true
    },
    selectedServiceCountry: {
      type: String,
      require: true
    },
    caseDescription: String,
    requesterEmail: {
      type: String,
      require: true
    },
    casePaymentStatus: {
      type: String,
      enum: ['free', 'paid'], 
     
    },
    status: {
      type: String,
      enum: ['submitted', 'pending', 'working', 'cancelled', 'completed', 'rejected','transfer'],

    },
    follower: {
      type: String,
      default: "unread"
    }
  },
  { timestamps: true }
);

export default mongoose.model("CourtService_Case", CourtCaseSchema);
