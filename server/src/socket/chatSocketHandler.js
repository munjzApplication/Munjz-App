import chatMessage from "../models/chat/chatMessage.js";

const chatSocketHandler = (namespace, socket, io) => {
  // Subscribe to a room
  socket.on("subscribe", ({ userName, userId, userRole, roomName }) => {
    socket.userName = userName;
    socket.userId = userId;
    socket.userRole = userRole;
    socket.join(roomName);
    console.log(`[${namespace.name}] ${socket.userName} joined room: ${roomName}`);
    namespace.to(roomName).emit("newUserToChatRoom", { userName: socket.userName });

    // Notify the other namespace about the new user
    const otherNamespace = socket.userRole === "consultant" ? io.of("/customer") : io.of("/consultant");
    otherNamespace.to(roomName).emit("newUserToChatRoom", { userName: socket.userName });
  });

  // Unsubscribe from a room
  socket.on("unsubscribe", ({ roomName }) => {
    socket.leave(roomName);
    console.log(`[${namespace.name}] ${socket.userName} left room: ${roomName}`);
    namespace.to(roomName).emit("userLeftChatRoom", { userName: socket.userName });

    // Notify the other namespace
    const otherNamespace = socket.userRole === "consultant" ? io.of("/customer") : io.of("/consultant");
    otherNamespace.to(roomName).emit("userLeftChatRoom", { userName: socket.userName });
  });

  // New chat message
  socket.on("newMessage", async ({ roomName, messageContent, receiverId, receiverRole }) => {
    const timestamp = new Date();

    try {
      // Validate inputs
      if (!socket.userId || !socket.userRole) {
        socket.emit("error", { message: "User not authenticated" });
        return;
      }

      // Save message to DB
      const savedMsg = await chatMessage.create({
        roomName,
        senderId: socket.userId,
        senderRole: socket.userRole,
        receiverId,
        receiverRole,
        messageContent,
        timestamp,
        messageType: "text",
      });

      console.log(`[${namespace.name}] ${socket.userName} -> ${roomName}: ${messageContent}`);

      // Broadcast the message
      const chatData = {
        _id: savedMsg._id,
        userName: socket.userName,
        messageContent,
        roomName,
        timestamp: savedMsg.createdAt,
        status: savedMsg.status,
      };

      // Broadcast to the current namespace
      socket.broadcast.to(roomName).emit("updateChat", chatData);

      // Forward to the other namespace
      const otherNamespace = receiverRole === "consultant" ? io.of("/consultant") : io.of("/customer");
      otherNamespace.to(roomName).emit("updateChat", chatData);
    } catch (error) {
      console.error("Error saving message:", error.message);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Typing indicator
  socket.on("typing", ({ roomName, receiverId }) => {
    const otherNamespace = socket.userRole === "consultant" ? io.of("/customer") : io.of("/consultant");
    socket.to(receiverId).emit("typing", { userName: socket.userName });
    otherNamespace.to(receiverId).emit("typing", { userName: socket.userName });
  });

  socket.on("stopTyping", ({ roomName, receiverId }) => {
    const otherNamespace = socket.userRole === "consultant" ? io.of("/customer") : io.of("/consultant");
    socket.to(receiverId).emit("stopTyping", { userName: socket.userName });
    otherNamespace.to(receiverId).emit("stopTyping", { userName: socket.userName });
  });

  // Mark message as delivered
  socket.on("messageDelivered", async ({ messageId }) => {
    try {
      const message = await chatMessage.findById(messageId);
      if (!message || message.receiverId.toString() !== socket.userId) {
        socket.emit("error", { message: "Unauthorized to update message status" });
        return;
      }

      const updated = await chatMessage.findByIdAndUpdate(
        messageId,
        { status: "delivered" },
        { new: true }
      );
      if (updated) {
        namespace.to(updated.roomName).emit("messageStatusUpdated", {
          messageId,
          status: "delivered",
        });
        // Notify the other namespace
        const otherNamespace = socket.userRole === "consultant" ? io.of("/customer") : io.of("/consultant");
        otherNamespace.to(updated.roomName).emit("messageStatusUpdated", {
          messageId,
          status: "delivered",
        });
      }
    } catch (err) {
      console.error("Delivery status update failed:", err.message);
      socket.emit("error", { message: "Failed to update delivery status" });
    }
  });

  // Mark message as read
  socket.on("messageRead", async ({ messageId }) => {
    try {
      const message = await chatMessage.findById(messageId);
      if (!message || message.receiverId.toString() !== socket.userId) {
        socket.emit("error", { message: "Unauthorized to update message status" });
        return;
      }

      const updated = await chatMessage.findByIdAndUpdate(
        messageId,
        { status: "read" },
        { new: true }
      );
      if (updated) {
        namespace.to(updated.roomName).emit("messageStatusUpdated", {
          messageId,
          status: "read",
        });
        // Notify the other namespace
        const otherNamespace = socket.userRole === "consultant" ? io.of("/customer") : io.of("/consultant");
        otherNamespace.to(updated.roomName).emit("messageStatusUpdated", {
          messageId,
          status: "read",
        });
      }
    } catch (err) {
      console.error("Read status update failed:", err.message);
      socket.emit("error", { message: "Failed to update read status" });
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`[${namespace.name}] ${socket.id} disconnected`);
  });
};

export default chatSocketHandler;