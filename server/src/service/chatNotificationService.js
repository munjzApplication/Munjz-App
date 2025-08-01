import { notificationService } from "./sendPushNotification.js";

export const sendChatNotification = async ({
  senderId,
  senderName,
  senderProfile,
  recipientRole,
  recipientId,
  messageText,
}) => {
  const dataPayload = {
    type: "chat",
    senderId,
    senderName,
    senderProfile,
    message: messageText,
  };

  const titleMap = {
    customer: "MUNJZ Support",
    consultant: "MUNJZ Support",
    admin: senderName, // Show sender name if to admin
  };

  const body = messageText;

  if (recipientRole === "customer") {
    return notificationService.sendToCustomer(recipientId, titleMap.customer, body, dataPayload);
  } else if (recipientRole === "consultant") {
    return notificationService.sendToConsultant(recipientId, titleMap.consultant, body, dataPayload);
  } else if (recipientRole === "admin") {
    return notificationService.sendToAdmin(titleMap.admin, body, dataPayload);
  }
};
