import ChatMessage from "../../models/chat/chatMessage.js";
import Customer from "../../models/Customer/customerModels/customerModel.js";

export const getMessagesByRoom = async (req, res) => {
  const { roomName } = req.params;
  try {
    const messages = await ChatMessage.find({ roomName, isDeleted: false }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages." });
  }
};

export const sendMessage = async (req, res) => {
  console.log("Received message data:", req.body);

  const { roomName, senderId, senderRole, receiverId, receiverRole, messageContent, messageType = "text" } = req.body;
  if (!roomName || !senderId || !receiverId || !messageContent) {
    return res.status(400).json({ error: "Missing required fields." });
  }
  try {
    const message = await ChatMessage.create({
      roomName, senderId, senderRole, receiverId, receiverRole, messageContent, messageType
    });
    res.status(200).json(message);
  } catch (err) {
    res.status(500).json({ error: "Failed to send message." });
  }
};

export const markMessagesAsRead = async (req, res) => {
  const { messageIds = [] } = req.body;
  try {
    await ChatMessage.updateMany({ _id: { $in: messageIds } }, { $set: { status: "read" } });
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

export const getCustomerRoomListForAdmin = async (req, res) => {
  try {
    const adminId = req.user._id;

    if (!adminId) {
      return res.status(400).json({ error: "Missing adminId." });
    }

    // Step 1: Find distinct customerId and roomName
    const customerRooms = await ChatMessage.aggregate([
      {
        $match: {
          $or: [
            { senderId: adminId, senderRole: "admin" },
            { receiverId: adminId, receiverRole: "admin" }
          ]
        }
      },
      {
        $project: {
          userId: {
            $cond: [
              { $eq: ["$senderId", adminId] },
              "$receiverId",
              "$senderId"
            ]
          },
          roomName: 1
        }
      },
      {
        $group: {
          _id: "$userId",
          roomName: { $first: "$roomName" } // just grab one roomName per user
        }
      }
    ]);

    const customerIds = customerRooms.map(entry => entry._id);

    // Step 2: Get customer info
    const customers = await Customer.find(
      { _id: { $in: customerIds } },
      "_id Name profilePhoto"
    );

    // Step 3: Map roomName into customer list
    const customersWithRoom = customers.map(customer => {
      const matchingRoom = customerRooms.find(room => room._id.toString() === customer._id.toString());
      return {
        _id: customer._id,
        Name: customer.Name,
        imageUrl: customer.profilePhoto || null,
        roomName: matchingRoom?.roomName || null
      };
    });

    res.status(200).json(customersWithRoom);
  } catch (err) {
    console.error("Failed to fetch admin chat customers:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
