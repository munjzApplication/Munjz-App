import ChatMessage from "../../models/chat/chatMessage.js";
import Customer from "../../models/Customer/customerModels/customerModel.js";
import ConsultantProfile from "../../models/Consultant/ProfileModel/User.js";

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
    const adminId = req.user._id;

    if (!adminId) {
      return res.status(400).json({ error: "Missing adminId." });
    }

    // Step 1: Get latest chat room entries grouped by other user
    const chatUsers = await ChatMessage.aggregate([
      {
        $match: {
          $or: [
            { senderId: adminId, senderRole: "admin" },
            { receiverId: adminId, receiverRole: "admin" }
          ]
        }
      },
      {
        $addFields: {
          userId: {
            $cond: [{ $eq: ["$senderId", adminId] }, "$receiverId", "$senderId"]
          },
          userRole: {
            $cond: [
              { $eq: ["$senderId", adminId] },
              "$receiverRole",
              "$senderRole"
            ]
          }
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { userId: "$userId", userRole: "$userRole" },
          roomName: { $first: "$roomName" },
          latestAt: { $first: "$createdAt" },
          latestMessage: { $first: "$messageContent" } 
        }
      },
      { $sort: { latestAt: -1 } } // Final sort
    ]);

    // Step 2: Collect user IDs
    const customerIds = chatUsers
      .filter(r => r._id.userRole === "customer")
      .map(r => r._id.userId);

    const consultantIds = chatUsers
      .filter(r => r._id.userRole === "consultant")
      .map(r => r._id.userId);

    // Step 3: Get user details
    const [customers, consultants] = await Promise.all([
      Customer.find({ _id: { $in: customerIds } }, "_id Name profilePhoto"),
      ConsultantProfile.find({ _id: { $in: consultantIds } }, "_id Name profilePhoto")
    ]);

    const userMap = new Map();

    customers.forEach(c => userMap.set(c._id.toString(), { name: c.Name, imageUrl: c.profilePhoto, role: "customer" }));
    consultants.forEach(c => userMap.set(c._id.toString(), { name: c.Name, imageUrl: c.profilePhoto, role: "consultant" }));

    // Step 4: Final output
    const result = chatUsers
      .map(r => {
        const userIdStr = r._id.userId.toString();
        const user = userMap.get(userIdStr);
        if (!user) return null;

        return {
          _id: r._id.userId,
          name: user.name,
          role: user.role,
          imageUrl: user.imageUrl || "/asset/profile.jpg",
          roomName: r.roomName,
          lastMessageAt: r.latestAt,
          lastMessage: r.latestMessage || "",
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      message: "Chat room list fetched successfully.",
      data: result
    });

  } catch (err) {
    console.error("Admin chat room fetch error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

