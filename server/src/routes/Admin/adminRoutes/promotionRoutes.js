import express from "express";

import {
    sendPromotionalEmail,
  sendPromotionalNotification,
} from "../../../controllers/Admin/adminControllers/promotionController.js";
import upload from "../../../middlewares/fileUpload.js"
const router = express.Router();


// Email with image
router.post("/email", upload.array("image"), sendPromotionalEmail);

// Notification only
router.post("/notification", sendPromotionalNotification);

export default router;
