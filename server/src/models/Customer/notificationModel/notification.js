import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer_Profile', 
    required: true
  },
  notificationDetails: {
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    }
  },
  additionalData: { type: Object, default: {} }, 
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

const Notification = mongoose.model('Customer_Notification', NotificationSchema);

export default Notification;
