import express from "express";
import {
  getAdminNotifications,
    markNotificationAsRead,
} from "../../../controllers/Admin/notification/notificationController.js";

const router = express.Router();

router.post("/get", getAdminNotifications);
router.post("/mark-read/:id", markNotificationAsRead);

export default router;
