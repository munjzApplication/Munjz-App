import express from 'express';
import { getNotifications, markNotificationAsRead } from '../../../controllers/Consultant/notificationController.js';  // Import the controller functions

const router = express.Router();

// Route to get all notifications
router.get('/notifications/:consultantId', getNotifications);

// Route to mark a specific notification as read
router.put('/notifications/:notificationId/read', markNotificationAsRead);

export default router;
