import admin from "../config/firebaseConfig.js";

class NotificationService {
  async sendToCustomer(customerId, title, body, data = {}) {
    try {
      const message = {
        notification: { title, body },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          targetType: "customer"
        },
        topic: `customer_${customerId}`
      };

      const response = await admin.messaging().send(message);
      console.log(`Notification sent to customer ${customerId}:`, response);
      return response;
    } catch (error) {
      console.error("Error sending customer notification:", error);
      throw error;
    }
  }

  async sendToConsultant(consultantId, title, body, data = {}) {
    try {
      const message = {
        notification: { title, body },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          targetType: "consultant"
        },
        topic: `consultant_${consultantId}`
      };

      const response = await admin.messaging().send(message);
      console.log(`Notification sent to consultant ${consultantId}:`, response);
      return response;
    } catch (error) {
      console.error("Error sending consultant notification:", error);
      throw error;
    }
  }

  async sendToAdmin(title, body, data = {}) {
    try {
      const message = {
        notification: { title, body },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          targetType: "admin"
        },
        topic: "admin_notifications"
      };

      const response = await admin.messaging().send(message);
      console.log("Notification sent to admin:", response);
      return response;
    } catch (error) {
      console.error("Error sending admin notification:", error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
