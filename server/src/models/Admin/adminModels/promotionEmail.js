import mongoose from "mongoose";

const promotionalEmailSchema = new mongoose.Schema({
  content: { type: String, required: true },
  imageUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const PromotionalEmail =  mongoose.model("PromotionalEmail", promotionalEmailSchema);
export default PromotionalEmail;
