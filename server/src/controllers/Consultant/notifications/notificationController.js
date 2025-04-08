import ConsultantNotification from "../../../models/Consultant/notificationModel/ConsultantNotification.js";
import { formatTime } from "../../../helper/dateFormatter.js";

export const getConsultantNotifications = async (req, res) => {
  try {
    const consultantId = req.user._id;

    const groupedNotifications = await ConsultantNotification.aggregate([
      {
        $match: { consultantId }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%B %d", 
              date: "$timestamp",
              timezone: "Asia/Dubai" 
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
    const result = groupedNotifications.reduce((acc, { date, notifications }) => {
      acc[date] = notifications.map((notification) => ({
        ...notification,
        timestamp: formatTime(notification.timestamp) 
      }));
      return acc;
    }, {});
    

    res.status(200).json({message: "Consultant notifications fetched successfully",result});;
  } catch (error) {
    console.error("Error fetching consultant notifications:", error.message, error.stack);
    res.status(500).json({ message: "Failed to fetch notifications", error: error.message });
  }
};


export const markConsultantNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const updatedNotification = await ConsultantNotification.findByIdAndUpdate(
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