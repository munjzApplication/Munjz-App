import mongoose from "mongoose";

const personalDetailsSchema = new mongoose.Schema(
  {
    consultantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultant_Profile",
      required: true
    },
    profilePicture: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    },
    languages: {
      type: [String],
      required: true
    },
    areaOfPractices: {
      type: [String],
      required: true
    },
    experience: {
      type: Number,
      required: true
    },
    biography: {
      type: String,
      required: true
    },
  },
  {
    timestamps: true
  }
);

const PersonalDetails = mongoose.model(
  "Consultant_PersonalDetails",
  personalDetailsSchema
);
export default PersonalDetails;
