import mongoose from "mongoose";

const ConsultationDetailsSchema = new mongoose.Schema(
  {
    consultantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultant",
      required: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true
    },
    consultantShare: {
      type: Number,
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
    },
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
