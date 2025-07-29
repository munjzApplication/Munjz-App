import ChatMessage from "../models/chat/chatMessage.js";
import { verifySocketUser } from "../middlewares/chatAuth.js";

const registerChatHandlers = async (io, socket) => {
  const chatUser = await verifySocketUser(socket); // ✅ Auth done here ONLY

  if (!chatUser) {
    console.log("❌ Chat socket unauthorized:", socket.id);
    return; // Don't register chat events if not authenticated
  }

  socket.chatUser = chatUser; // ✅ Attach user to socket

  // ✅ Join Room
  socket.on("join-room", ({ roomName }) => {
    if (roomName) socket.join(roomName);
  });

  // ✅ Send message
  socket.on("send-message", async (data) => {
    const { roomName, receiverId, receiverRole, messageContent, messageType = "text" } = data;
    if (!roomName || !receiverId || !receiverRole || !messageContent) return;

    const message = await ChatMessage.create({
      roomName,
      senderId: chatUser.id,
      senderRole: chatUser.role,
      receiverId,
      receiverRole,
      messageContent,
      messageType
    });

    socket.emit("message-sent", message);
    socket.to(roomName).emit("receive-message", message);
  });

  // ✅ Typing
  socket.on("typing", ({ roomName }) => {
    socket.to(roomName).emit("typing", { senderId: chatUser.id });
  });

  // ✅ Mark as Read
  socket.on("mark-read", async ({ messageIds = [] }) => {
    await ChatMessage.updateMany({ _id: { $in: messageIds } }, { status: "read" });
  });

  // ✅ Delete message
  socket.on("delete-message", async ({ messageId }) => {
    try {
      await ChatMessage.findByIdAndUpdate(messageId, { isDeleted: true });
      socket.emit("message-deleted", { messageId });
    } catch (err) {
      socket.emit("message-delete-error", { messageId, error: err.message });
    }
  });

  // ✅ Delivered
  socket.on("delivered", async ({ messageIds = [] }) => {
    await ChatMessage.updateMany({ _id: { $in: messageIds } }, { status: "delivered" });
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
};

export default registerChatHandlers;
