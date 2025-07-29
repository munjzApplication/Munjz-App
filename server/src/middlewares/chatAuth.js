import jwt from "jsonwebtoken"; // ✅ This was missing
import Customer from "../models/Customer/customerModels/customerModel.js";
import Consultant from "../models/Consultant/ProfileModel/User.js";
import Admin from "../models/Admin/adminModels/adminModel.js";

export const verifySocketUser = async (socket) => {
  try {
    const auth = socket?.handshake?.auth;
    if (!auth || !auth.token || !auth.role) return null;

    const { token, role } = auth;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let model;
    switch (role) {
      case "customer":
        model = Customer;
        break;
      case "consultant":
        model = Consultant;
        break;
      case "admin":
        model = Admin;
        break;
      default:
        return null;
    }

    const user = await model.findById(decoded.id);
    return user ? { id: user._id.toString(), role } : null;
  } catch (err) {
    console.log("verifySocketUser error:", err.message);
    return null;
  }
};
