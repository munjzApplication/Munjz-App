import express from "express";
import {
    getConsultantNotifications,
    markConsultantNotificationRead,
} from "../../../../controllers/Consultant/notifications/notificationController.js";

const router = express.Router();

router.get("/get", getConsultantNotifications);
router.get("/mark-read/:id", markConsultantNotificationRead);

export default router;
