import ChatMessage from "../../models/chat/chatMessage.js";
import Customer from "../../models/Customer/customerModels/customerModel.js";
import ConsultantProfile from "../../models/Consultant/ProfileModel/User.js";
import PersonalDetails from "../../models/Consultant/ProfileModel/personalDetails.js";

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

    // Step 2: Separate user IDs
    const customerIds = [];
    const consultantIds = [];
    chatUsers.forEach(({ _id }) => {
      _id.userRole === "customer" && customerIds.push(_id.userId);
      _id.userRole === "consultant" && consultantIds.push(_id.userId);
    });

    // Step 3: Fetch customer + consultant info
    const [customers, consultants, personalDetails] = await Promise.all([
      Customer.find({ _id: { $in: customerIds } }, "_id Name profilePhoto"),
      ConsultantProfile.find({ _id: { $in: consultantIds } }, "_id Name profilePhoto"),
      PersonalDetails.find({ consultantId: { $in: consultantIds } }, "consultantId profilePicture")
    ]);

    // Step 4: Build userMap for fast access
    const userMap = new Map();

    customers.forEach(user => {
      userMap.set(user._id.toString(), {
        name: user.Name,
        imageUrl: user.profilePhoto || null,
        role: "customer"
      });
    });

    const profilePhotoFallback = new Map();
    personalDetails.forEach(p => {
      profilePhotoFallback.set(p.consultantId.toString(), p.profilePicture);
    });

    consultants.forEach(user => {
      const id = user._id.toString();
      userMap.set(id, {
        name: user.Name,
        imageUrl: user.profilePhoto || profilePhotoFallback.get(id) || null,
        role: "consultant"
      });
    });

    // Step 5: Construct final response
    const result = chatUsers.map(r => {
      const idStr = r._id.userId.toString();
      const user = userMap.get(idStr);
      if (!user) return null;

      return {
        _id: idStr,
        name: user.name,
        role: user.role,
        imageUrl: user.imageUrl,
        roomName: r.roomName,
        lastMessageAt: r.latestAt,
        lastMessage: r.latestMessage || ""
      };
    }).filter(Boolean);

    return res.status(200).json({
      message: "Chat room list fetched successfully.",
      data: result
    });

  } catch (err) {
    console.error("Admin chat room fetch error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

