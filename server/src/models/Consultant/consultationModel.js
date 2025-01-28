import mongoose from "mongoose";

const ConsultationDetailsSchema = new mongoose.Schema(
  {
    consultantShare: {
      type: Number,
      required: true
    },
    consultantEmail: {
      type: String,
      required: true
    },

    customerEmail: {
      type: String,
      required: true
    },
    consultationRating: {
      type: Number,
      min: 1,
      max: 5
    },
  
    consultationDate: {
      type: Date,
      required: true
    },
    consultationDuration: {
      type: Number,
      required: true
    },
  
    stringFeedback:{
        type:String
    }
  },
  {
    timestamps: true
  }
);

const consultationDetails = mongoose.model(
  "ConsultationDetails",
  ConsultationDetailsSchema
);
export default consultationDetails;
