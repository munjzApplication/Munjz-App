import Notification from "../../../models/Customer/notificationModel/notification.js";

export const getCustomerNotifications = async (req, res) => {
  try {
    const { customerId } = req.params;

    const notifications = await Notification.find({ customerId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      message: "Notifications fetched successfully.",
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch notifications.",
      error: error.message,
    });
  }
};

export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;


    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read and removed.",
    });
  } catch (error) {
    next(error);
  }
};
