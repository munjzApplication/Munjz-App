import ChatMessage from "../../models/chat/chatMessage.js";
import Customer from "../../models/Customer/customerModels/customerModel.js";
import ConsultantProfile from "../../models/Consultant/ProfileModel/User.js";
import PersonalDetails from "../../models/Consultant/ProfileModel/personalDetails.js";
import mongoose from "mongoose";
export const getAdminChatRoomsList = async adminId => {
  // Convert string id to ObjectId if needed
  if (!(adminId instanceof mongoose.Types.ObjectId)) {
    adminId = new mongoose.Types.ObjectId(adminId);
  }
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
    { $sort: { latestAt: -1 } }
  ]);

  const customerIds = [];
  const consultantIds = [];
  chatUsers.forEach(({ _id }) => {
    if (_id.userRole === "customer") customerIds.push(_id.userId);
    if (_id.userRole === "consultant") consultantIds.push(_id.userId);
  });

  const [customers, consultants, personalDetails] = await Promise.all([
    Customer.find({ _id: { $in: customerIds } }, "_id Name profilePhoto"),
    ConsultantProfile.find(
      { _id: { $in: consultantIds } },
      "_id Name profilePhoto"
    ),
    PersonalDetails.find(
      { consultantId: { $in: consultantIds } },
      "consultantId profilePicture"
    )
  ]);

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

  return chatUsers
    .map(r => {
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
    })
    .filter(Boolean);
};
