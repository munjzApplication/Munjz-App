import ChatMessage from "../models/chat/chatMessage.js";
import { verifySocketUser } from "../middlewares/chatAuth.js";
import { getAdminChatRoomsList} from "../helper/chat/chatHelper.js";

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
      console.log(
        ` ${chatUser.role} (${chatUser.id}) joined room: ${roomName}`
      );
    }
  });

  //Send message

  socket.on("send-message", async data => {
    try {
      const {
        roomName,
        receiverId,
        receiverRole,
        messageContent,
        messageType = "text"
      } = data;

      if (!roomName || !receiverId || !receiverRole || !messageContent) {
        console.log("❌ Missing fields in send-message");
        return;
      }

      const message = await ChatMessage.create({
        roomName,
        senderId: chatUser.id,
        senderRole: chatUser.role,
        receiverId,
        receiverRole,
        messageContent,
        messageType
      });

      // ✅ Send ONLY to the sender
      socket.emit("message-sent", message);

      // ✅ Send ONLY to receiver by namespace
      const namespaces = {
        admin: "/admin",
        customer: "/customer",
        consultant: "/consultant"
      };

      const receiverNamespace = namespaces[receiverRole];
      if (receiverNamespace) {
        io.of(receiverNamespace).to(roomName).emit("receive-message", message);
      } else {
        console.warn(`⚠️ Unknown receiver role: ${receiverRole}`);
      }

    // 🔍 Admin chat list update
    if (receiverRole === "admin") {
      console.log("🔄 Updating chat list for admin:", receiverId);
      const updatedList = await getAdminChatRoomsList(receiverId);
      console.log("📦 Updated Admin Chat List:", updatedList);
      io.of("/admin").emit("refresh-chat-list", {
        message: "Chat room list fetched successfully.",
        data: updatedList
      });
    } else if (chatUser.role === "admin") {
      console.log("🔄 Updating chat list for admin:", chatUser.id);
      const updatedList = await getAdminChatRoomsList(chatUser.id);
      console.log("📦 Updated Admin Chat List:", updatedList);
      io.of("/admin").emit("refresh-chat-list", {
        message: "Chat room list fetched successfully.",
        data: updatedList
      });
    }


    } catch (err) {
      console.error("❌ Error in send-message:", err.message);
      socket.emit("message-send-error", { error: err.message });
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
    await ChatMessage.updateMany(
      { _id: { $in: messageIds } },
      { status: "read" }
    );
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
    await ChatMessage.updateMany(
      { _id: { $in: messageIds } },
      { status: "delivered" }
    );
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(` Disconnected: ${socket.id}`);
  });
};

export default registerChatHandlers;
