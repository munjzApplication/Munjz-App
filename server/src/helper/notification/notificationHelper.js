import Notification from "../../models/Admin/notificationModels/notificationModel.js";

export const createAdminNotification = async (message, type, relatedId = null) => {
  try {
    const newNotification = new Notification({
      recipientType: "admin",
      recipientId: null,
      message,
      type,
      status: "unread",
      createdAt: new Date(),
      relatedId,
    });
    await newNotification.save();
  } catch (error) {
    console.error("Error creating admin notification:", error);
  }
};
