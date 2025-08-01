
import { notificationService } from "../service/sendPushNotification.js";

export const sendChatNotification = async ({
  senderId,
  senderName = "",
  senderProfile = "",
  recipientRole,
  recipientId,
  messageText,
}) => {
  if (!recipientRole || !recipientId || !senderId || !messageText) {
    console.warn("❗Missing required fields in sendChatNotification");
    return;
  }

  const dataPayload = {
    type: "chat",
    senderId: String(senderId),
    senderName: String(senderName || ""),
    senderProfile: String(senderProfile || ""),
    message: String(messageText),
  };

  const titleMap = {
    customer: "MUNJZ Support",
    consultant: "MUNJZ Support",
    admin: senderName || "MUNJZ User",
  };

  const body = messageText;

  try {
    switch (recipientRole) {
      case "customer":
        return await notificationService.sendToCustomer(
          recipientId,
          titleMap.customer,
          body,
          dataPayload
        );
      case "consultant":
        return await notificationService.sendToConsultant(
          recipientId,
          titleMap.consultant,
          body,
          dataPayload
        );
      case "admin":
        return await notificationService.sendToAdmin(
          recipientId, // Ensure this matches expected param in `sendToAdmin`
          titleMap.admin,
          body,
          dataPayload
        );
      default:
        console.warn(`❗Unsupported recipientRole: ${recipientRole}`);
    }
  } catch (error) {
    console.error("❌ Error in sendChatNotification:", error);
  }
};
