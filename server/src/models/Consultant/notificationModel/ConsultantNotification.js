import mongoose from 'mongoose';

const consultantNotificationSchema = new mongoose.Schema({
  consultantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultant', required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  data: { type: Object, default: {} },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false }
});

export default mongoose.model('ConsultantNotification', consultantNotificationSchema);
