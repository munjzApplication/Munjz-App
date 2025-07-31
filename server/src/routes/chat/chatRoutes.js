import express from "express";
import {
  getMessagesByRoom,
  sendMessage,
  markMessagesAsRead,
  softDeleteMessage,
  getCustomerRoomListForAdmin
} from "../../controllers/chat/chatController.js";
import { protectAdmin } from "../../middlewares/adminMiddleware.js";

const router = express.Router();

router.get("/room/:roomName", getMessagesByRoom);
router.post("/send", sendMessage);
router.patch("/mark-read", markMessagesAsRead);
router.delete("/:id", softDeleteMessage);
router.get("/customer/rooms", protectAdmin, getCustomerRoomListForAdmin);

export default router;