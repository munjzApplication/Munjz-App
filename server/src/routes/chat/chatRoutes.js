import express from "express";
import {
  getMessagesByRoom,
  sendMessage,
  markMessagesAsRead,
  softDeleteMessage
} from "../../controllers/chat/chatController.js";

const router = express.Router();

router.get("/chat-room/:roomId/getmessages", getMessagesByRoom);
router.post("/send-message", sendMessage);
router.patch("/mark-messages-read", markMessagesAsRead);
router.delete("/delete-message/:messageId", softDeleteMessage);

export default router;