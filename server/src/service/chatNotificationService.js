
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
    console.warn("❗Missing required fields in sendChatNotification", {
      senderId,
      recipientId,
      recipientRole,
      messageText,
    });
    return;
  }

  const dataPayload = {
    type: "chat",
    senderId: String(senderId),
    senderName: String(senderName),
    senderProfile: String(senderProfile),
    message: String(messageText),
  };

  const titleMap = {
    customer: "MUNJZ Support",
    consultant: "MUNJZ Support",
    admin: senderName || "MUNJZ User",
  };

  const notificationTitle = titleMap[recipientRole] || "MUNJZ Message";
  const body = messageText;

  try {
    switch (recipientRole) {
      case "customer":
        return await notificationService.sendToCustomer(
          recipientId,
          notificationTitle,
          body,
          dataPayload
        );

      case "consultant":
        return await notificationService.sendToConsultant(
          recipientId,
          notificationTitle,
          body,
          dataPayload
        );

      case "admin":
        return await notificationService.sendToAdmin(
          recipientId,
          notificationTitle,
          body,
          dataPayload
        );

      default:
        console.warn(`❗Unsupported recipientRole: ${recipientRole}`);
        return;
    }
  } catch (error) {
    console.error("❌ Error in sendChatNotification:", {
      error: error.message,
      recipientRole,
      recipientId,
    });
  }
};
