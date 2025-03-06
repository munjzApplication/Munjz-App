import express from "express";
import {
    getCustomerNotifications,
    markNotificationAsRead,
} from "../../../controllers/Customer/notification/notificationController.js";

const router = express.Router();

router.get("/get", getCustomerNotifications);
router.get("/mark-read/:id", markNotificationAsRead);

export default router;
