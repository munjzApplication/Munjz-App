import mongoose from "mongoose";

const CourtCaseSchema = new mongoose.Schema(
  {
    customerID: {
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
      default: 'free', 
    },
    follower: {
      type: String,
      default: "unread"
    }
  },
  { timestamps: true }
);

export default mongoose.model("CourtService_Case", CourtCaseSchema);
