import express from "express";
import {
    getCustomerNotifications,
    markNotificationAsRead,
} from "../../../controllers/Customer/notification/notificationController.js";

const router = express.Router();

router.post("/get", getCustomerNotifications);
router.post("/mark-read/:id", markNotificationAsRead);

export default router;
