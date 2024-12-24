import Notification from "../../models/Consultant/notification.js";

export const sendNotificationToConsultant = async (
  consultantId,
  message,
  title,
  additionalData
) => {
  if (!consultantId) {
    console.error("Customer ID is missing while sending notification.");
    return;
  }

  const newNotification = new Notification({
    consultantId,
    notificationDetails: {
      title: title,
      message: message
    },
    additionalData,
    status: "unread",
    createdAt: new Date() 
  });

  try {
    console.log("New Notification Object:", newNotification); 
    await newNotification.save();
    console.log("Notification saved successfully.");
  } catch (error) {
    console.error("Error saving notification:", error.message, error);
  }
};
