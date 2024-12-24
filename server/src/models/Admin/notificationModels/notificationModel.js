import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  notificationDetails: {
    type: Object,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ["unread", "read"],
    default: "unread"
  }
}, { timestamps: true });

const Notification = mongoose.model('Admin_NotificationModel', NotificationSchema);

export default Notification;
