import Notification from "../../models/Customer/notificationModel/notification.js";

export const sendNotificationToCustomer = async (
  customerId,
  message,
  title,
  additionalData
) => {
  if (!customerId) {
    console.error("Customer ID is missing while sending notification.");
    return;
  }

  const newNotification = new Notification({
    customerId,
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
