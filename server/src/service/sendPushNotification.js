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

  async sendToAllCustomers(title, body, data = {}) {
    try {
      const message = {
        notification: { title, body },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          targetType: "customer"
        },
        topic: "all_Customers"
      };

      const response = await admin.messaging().send(message);
      console.log("Notification sent to all customers:", response);
      return response;
    } catch (error) {
      console.error("Error sending notification to all customers:", error);
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

  async sendToAllConsultants(title, body, data = {}) {
    try {
      const message = {
        notification: { title, body },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          targetType: "consultant"
        },
        topic: "all_Consultants"
      };

      const response = await admin.messaging().send(message);
      console.log("Notification sent to all consultants:", response);
      return response;
    } catch (error) {
      console.error("Error sending notification to all consultants:", error);
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
