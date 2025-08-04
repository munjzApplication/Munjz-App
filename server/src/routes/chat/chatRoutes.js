import express from "express";
import {
  getMessagesByRoom,
  sendMessage,
  markMessagesAsRead,
  softDeleteMessage,
  getAdminChatRooms
} from "../../controllers/chat/chatController.js";
import { protectAdmin } from "../../middlewares/adminMiddleware.js";

const router = express.Router();

router.get("/room/:roomName", getMessagesByRoom);
router.post("/send", sendMessage);
router.patch("/mark-read", markMessagesAsRead);
router.delete("/:id", softDeleteMessage);
router.get("/admin/chat-rooms", protectAdmin, getAdminChatRooms);

export default router;