import express from "express";
import {
    getConsultantNotifications,
    markConsultantNotificationRead,
} from "../../../../controllers/Consultant/notifications/notificationController.js";

const router = express.Router();

router.post("/get", getConsultantNotifications);
router.post("/mark-read/:id", markConsultantNotificationRead);

export default router;
