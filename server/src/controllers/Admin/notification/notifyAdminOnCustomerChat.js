import { notificationService } from '../../../service/sendPushNotification.js';

export const notifyAdminOnCustomerChat = async (req, res) => {
    const { topic,title, body } = req.body;
  
    if (!topic || !title || !body) {
      return res.status(400).json({ error: 'Title, topic, and body are required' });
    }
  
    try {
      const data = {}; // No additional message, so data stays empty (or add if needed)
  
      await notificationService.sendNotificationToTopic(topic, title, body, data);
  
      res.status(200).json({ message: 'Notification sent successfully' });
    } catch (error) {
      console.error('Error sending admin notification:', error);
      res.status(500).json({ error: 'Failed to notify admin' });
    }
  };
  
