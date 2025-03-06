import express from "express";
import {
  getAdminNotifications,
    markNotificationAsRead,
} from "../../../controllers/Admin/notification/notificationController.js";

const router = express.Router();

router.get("/get", getAdminNotifications);
router.get("/mark-read/:id", markNotificationAsRead);

export default router;
