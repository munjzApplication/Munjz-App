import ChatMessage from "../models/chat/chatMessage.js";
import { verifySocketUser } from "../middlewares/chatAuth.js";

const registerChatHandlers = async (io, socket) => {
  const chatUser = await verifySocketUser(socket); //  Auth done here ONLY

  if (!chatUser) {
    console.log("Chat socket unauthorized:", socket.id);
    return; // Don't register chat events if not authenticated
  }
console.log(` ${chatUser.role} connected:`, socket.id);
  socket.chatUser = chatUser; // Attach user to socket

  // oin Room
  socket.on("join-room", ({ roomName }) => {
    if (roomName) {
      socket.join(roomName);
      console.log(` ${chatUser.role} (${chatUser.id}) joined room: ${roomName}`);
    }

  });

  //Send message

socket.on("send-message", async (data) => {
  const { roomName, receiverId, receiverRole, messageContent, messageType = "text" } = data;
  console.log("💬 send-message received from frontend:", data);

  if (!roomName || !receiverId || !receiverRole || !messageContent) {
    console.log("❌ Missing fields in send-message");
    return;
  }

  // Save message to DB
  const message = await ChatMessage.create({
    roomName,
    senderId: chatUser.id,
    senderRole: chatUser.role,
    receiverId,
    receiverRole,
    messageContent,
    messageType,
  });

  console.log("✅ Message saved to DB:", message);

  // Emit back to sender (confirm send)
  socket.emit("message-sent", message);

  // ✅ Emit to room in ALL namespaces (admin, consultant, customer)
  const namespaces = ["/customer", "/consultant", "/admin"];

  console.log(`📢 Broadcasting message to room '${roomName}' across namespaces...`);

  for (const ns of namespaces) {
    const nsp = io.of(ns);
    if (nsp) {
      nsp.to(roomName).emit("receive-message", message);
      console.log(`✅ Emitted to namespace '${ns}' room '${roomName}'`);
    } else {
      console.log(`⚠️ Namespace '${ns}' not found or has no connected sockets`);
    }
  }
});


  // Typing
  socket.on("typing", ({ roomName }) => {
    console.log(` Typing from ${chatUser.id} in room ${roomName}`);
    socket.to(roomName).emit("typing", { senderId: chatUser.id });
  });

  // Mark as Read
  socket.on("mark-read", async ({ messageIds = [] }) => {
    console.log(" mark-read for:", messageIds);
    await ChatMessage.updateMany({ _id: { $in: messageIds } }, { status: "read" });
  });

  // Delete message
  socket.on("delete-message", async ({ messageId }) => {
    try {
      console.log(" delete-message:", messageId);
      await ChatMessage.findByIdAndUpdate(messageId, { isDeleted: true });
      socket.emit("message-deleted", { messageId });
    } catch (err) {
      console.log(" delete-message error:", err.message);
      socket.emit("message-delete-error", { messageId, error: err.message });
    }
  });

  // Delivered
  socket.on("delivered", async ({ messageIds = [] }) => {
    console.log(" delivered:", messageIds);
    await ChatMessage.updateMany({ _id: { $in: messageIds } }, { status: "delivered" });
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(` Disconnected: ${socket.id}`);
  });
};

export default registerChatHandlers;
