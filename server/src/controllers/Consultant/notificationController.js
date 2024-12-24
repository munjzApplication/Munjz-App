import Notification from "../../models/Consultant/notification.js";

export const getNotifications = async (req, res, next) => {
  try {
    const { consultantId } = req.params;
    const notifications = await Notification.find({ consultantId })
      .sort({ createdAt: -1 })
      .limit(50);

    if (!notifications || notifications.length === 0) {
      return res.status(404).json({
        message: "No notifications found."
      });
    }

    return res.status(200).json({
      message: "Notifications fetched successfully.",
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

// Controller to mark a specific notification as read
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
