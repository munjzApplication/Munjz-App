import Notification from "../../../models/Admin/notificationModels/notificationModel.js";

// Fetch Admin Notifications
export const getAdminNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 }) // Sort by latest
      .limit(50); // Fetch the latest 50 notifications

    res.status(200).json({
      success: true,
      message: "Notifications fetched successfully.",
      notifications
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found."
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read and removed."
    });
  } catch (error) {
    next(error);
  }
};
