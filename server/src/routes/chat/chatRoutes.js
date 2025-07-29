import express from "express";
import {
  getMessagesByRoom,
  sendMessage,
  markMessagesAsRead,
  softDeleteMessage
} from "../../controllers/chat/chatController.js";

const router = express.Router();

router.get("/room/:roomName", getMessagesByRoom);
router.post("/send", sendMessage);
router.patch("/mark-read", markMessagesAsRead);
router.delete("/:id", softDeleteMessage);

export default router;