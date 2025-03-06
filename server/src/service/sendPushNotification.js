import admin from "../config/firebaseConfig.js";
import ConsultantNotification from "../models/Consultant/notificationModel/ConsultantNotification.js";
import CustomerNotification from "../models/Customer/notificationModel/CustomerNotification.js";
import AdminNotification from "../models/Admin/notificationModels/AdminNotification.js";

class NotificationService {
  async sendNotificationToTopic(topic, title, body, data = {}) {
    const message = {
      notification: { title, body },
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      },
      topic,
    };
    return await admin.messaging().send(message);
  }

  async saveNotification(model, payload) {
    try {
      await model.create(payload);
    } catch (error) {
      console.error("Error saving notification to DB:", error);
    }
  }

  async sendToCustomer(customerId, title, body, data = {}) {
    const response = await this.sendNotificationToTopic(
      `customer_${customerId}`,
      title,
      body,
      data
    );

    await this.saveNotification(CustomerNotification, {
      customerId,
      title,
      body,
      data: JSON.stringify(data),
      timestamp: new Date(),
    });

    return response;
  }

  async sendToAllCustomers(title, body, data = {}) {
    const response = await this.sendNotificationToTopic(
      "all_Customers",
      title,
      body,
      data
    );

    await this.saveNotification(CustomerNotification, {
      customerId: null,
      title,
      body,
      data: JSON.stringify(data),
      timestamp: new Date(),
    });

    return response;
  }

  async sendToConsultant(consultantId, title, body, data = {}) {
    const response = await this.sendNotificationToTopic(
      `consultant_${consultantId}`,
      title,
      body,
      data
    );

    await this.saveNotification(ConsultantNotification, {
      consultantId,
      title,
      body,
      data: JSON.stringify(data),
      timestamp: new Date(),
    });

    return response;
  }

  async sendToAllConsultants(title, body, data = {}) {
    const response = await this.sendNotificationToTopic(
      "all_Consultants",
      title,
      body,
      data
    );

    await this.saveNotification(ConsultantNotification, {
      consultantId: null,
      title,
      body,
      data: JSON.stringify(data),
      timestamp: new Date(),
    });

    return response;
  }

  async sendToAdmin(title, body, data = {}) {
    const response = await this.sendNotificationToTopic(
      "admin_notifications",
      title,
      body,
      data
    );

    await this.saveNotification(AdminNotification, {
      title,
      body,
      data: JSON.stringify(data),
      timestamp: new Date(),
    });

    return response;
  }
}

export const notificationService = new NotificationService();
