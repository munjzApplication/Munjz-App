import mongoose from "mongoose";

const consultationDurationSchema = new mongoose.Schema(
  {
    consultationDuration: {
      type: Number,
      required: true,
    },

  },
  {
    timestamps: true,
  }
);

const ConsultationDuration = mongoose.model('ConsultationDuration', consultationDurationSchema);

export default ConsultationDuration;
