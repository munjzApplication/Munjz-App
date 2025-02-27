import mongoose from "mongoose";

const TranslationDocumentSchema = new mongoose.Schema({
  translationCase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Translation_Details",
    required: true
  },
  Documents: {
    type: [
      {
        documentUrl: { type: String, required: true },
        uploadedAt: { type: Date, required: true }
      }
    ],
    // required: true,
    default: []
  },

  noOfPage: {
    type: Number,
    required: false
  },
  SubmitionDate: {
    type: String,
    require: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model(
  "Translation_Document",
  TranslationDocumentSchema
);
