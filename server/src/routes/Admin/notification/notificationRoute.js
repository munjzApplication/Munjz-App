import express from "express";
import {
  getAdminNotifications,
  markNotificationAsRead
} from "../../../controllers/Admin/notification/notificationController.js";

const router = express.Router();

// Get all admin notifications
router.get("/notifications", getAdminNotifications);

// Mark a notification as read
router.patch("/notifications/:notificationId", markNotificationAsRead);

export default router;
