import mongoose from 'mongoose';

const adminNotificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  data: { type: Object, default: {} },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false }
});

export default mongoose.model('AdminNotification', adminNotificationSchema);
