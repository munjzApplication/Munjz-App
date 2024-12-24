import { Router } from "express";
import { getCustomerNotifications } from "../../../controllers/Customer/notification/notificationController.js";

const router = Router();

// Route to get customer notifications
router.get("/notifications/:customerId", getCustomerNotifications);

export default router;
