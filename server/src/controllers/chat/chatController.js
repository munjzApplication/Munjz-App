import ChatMessage from "../../models/chat/chatMessage.js";
import Customer from "../../models/Customer/customerModels/customerModel.js";
import ConsultantProfile from "../../models/Consultant/ProfileModel/User.js";
import PersonalDetails from "../../models/Consultant/ProfileModel/personalDetails.js";
import { getAdminChatRoomsList} from "../../helper/chat/chatHelper.js";

export const getMessagesByRoom = async (req, res) => {
  const { roomName } = req.params;
  try {
    const messages = await ChatMessage.find({
      roomName,
      isDeleted: false
    }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages." });
  }
};

export const sendMessage = async (req, res) => {
  console.log("Received message data:", req.body);

  const {
    roomName,
    senderId,
    senderRole,
    receiverId,
    receiverRole,
    messageContent,
    messageType = "text"
  } = req.body;
  if (!roomName || !senderId || !receiverId || !messageContent) {
    return res.status(400).json({ error: "Missing required fields." });
  }
  try {
    const message = await ChatMessage.create({
      roomName,
      senderId,
      senderRole,
      receiverId,
      receiverRole,
      messageContent,
      messageType
    });
    res.status(200).json(message);
  } catch (err) {
    res.status(500).json({ error: "Failed to send message." });
  }
};

export const markMessagesAsRead = async (req, res) => {
  const { messageIds = [] } = req.body;
  try {
    await ChatMessage.updateMany(
      { _id: { $in: messageIds } },
      { $set: { status: "read" } }
    );
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update message status." });
  }
};

export const softDeleteMessage = async (req, res) => {
  const { id } = req.params;
  try {
    await ChatMessage.findByIdAndUpdate(id, { isDeleted: true });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete message." });
  }
};


export const getAdminChatRooms = async (req, res) => {
  try {
     console.log("🔍 [DEBUG] getAdminChatRooms API called");
    const adminId = req.user?._id;
     console.log("🔍 [DEBUG] Extracted adminId:", adminId);
    if (!adminId) {
      return res.status(400).json({ error: "Missing adminId." });
    }
    console.log("🔍 [DEBUG] Fetching chat rooms for adminId:", adminId);

    const result = await getAdminChatRoomsList(adminId);
     console.log("✅ [DEBUG] Chat rooms fetched:", result?.length || 0);

     
    return res.status(200).json({
      message: "Chat room list fetched successfully.",
      data: result
    });
  } catch (err) {
    console.error("Admin chat room fetch error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};