import mongoose from "mongoose";

const promotionalNotificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const PromotionalNotification =  mongoose.model("PromotionalNotification", promotionalNotificationSchema);
export default PromotionalNotification;