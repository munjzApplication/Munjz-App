import express from "express";
import {
  getAdminNotifications,
    markNotificationAsRead,
} from "../../../controllers/Admin/notification/notificationController.js";
import { notifyAdminOnCustomerChat } from "../../../controllers/Admin/notification/notifyAdminOnCustomerChat.js";

const router = express.Router();

router.get("/get", getAdminNotifications);
router.get("/mark-read/:id", markNotificationAsRead);

router.post('/notify-admin', notifyAdminOnCustomerChat);

export default router;
