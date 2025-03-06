import CustomerNotification from "../../../models/Customer/notificationModel/CustomerNotification.js";

// Get all notifications grouped by date using aggregation pipeline
export const getConsultantNotifications = async (req, res) => {
  try {
    const customerId = req.user._id;
    const groupedNotifications = await CustomerNotification.aggregate([
      {
        $match: { customerId }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$timestamp",
              timezone: "Asia/Dubai" // UAE timezone
            }
          },
          notifications: { $push: "$$ROOT" }
        }
      },
      {
        $project: {
          date: "$_id",
          notifications: 1,
          _id: 0
        }
      },
      {
        $sort: { date: -1 }
      }
    ]);

    // Convert array to object format for better client-side consumption
    const result = groupedNotifications.reduce((acc, { date, notifications }) => {
      acc[date] = notifications;
      return acc;
    }, {});

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching customer notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

// Mark a notification as read with existence check
export const markConsultantNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const updatedNotification = await CustomerNotification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true, runValidators: true }
    );

    if (!updatedNotification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({
      message: "Notification marked as read",
      notification: updatedNotification
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Failed to mark notification" });
  }
};
