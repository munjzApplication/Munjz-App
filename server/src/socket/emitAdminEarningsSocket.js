// utils/socket/emitAdminEarningsSocket.js
import { io } from "../socket/socketController.js";
import  AdminEarnings from "../models/Admin/adminModels/earningsModel.js";
import CustomerProfile from "../models/Customer/customerModels/customerModel.js";

export const emitAdminEarningsSocket = async (earningDoc) => {
  const totalEarnings = await AdminEarnings.aggregate([
    { $group: { _id: null, total: { $sum: "$serviceAmount" } } }
  ]);

  let customerName = "";
  if (earningDoc.customerId) {
    const customer = await CustomerProfile.findById(earningDoc.customerId);
    if (customer) {
      customerName = customer.Name;
    }
  }

  const adminNamespace = io.of("/admin");
  adminNamespace.emit("admin-earnings-update", {
    message: "New admin earning recorded",
    totalEarnings: totalEarnings[0]?.total || 0,
    data: {
      _id: earningDoc._id,
      customerId: earningDoc.customerId,
      currency: earningDoc.currency,
      serviceAmount: earningDoc.serviceAmount,
      serviceName: earningDoc.serviceName,
      reason: earningDoc.reason,
      createdAt: earningDoc.createdAt,
      customerName, 
    }
  });
};
