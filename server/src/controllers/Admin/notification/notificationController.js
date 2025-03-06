
import AdminNotification from "../../../models/Admin/notificationModels/AdminNotification.js";

// Get all notifications for a consultant
export const getAdminNotifications = async (req, res) => {
  try {
    const notifications = await AdminNotification.find().sort({ timestamp: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching consultant notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    await AdminNotification.findByIdAndUpdate(notificationId, { isRead: true });
    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Failed to mark notification" });
  }
};
