import mongoose from 'mongoose';

const customerNotificationSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  data: { type: Object, default: {} },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false }
});

export default mongoose.model('CustomerNotification', customerNotificationSchema);
