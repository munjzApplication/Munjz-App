import jwt from "jsonwebtoken";
import Admin from "../../models/admin/adminModel.js";
import ConsultantProfile from "../../models/consultant/ProfileModel.js";
import CustomerProfile from "../../models/customer/customerModel.js";

export const chatAuthMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  try {
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user;

    switch (decoded.role) {
      case "admin":
        user = await Admin.findById(decoded.id).select("-password");
        break;
      case "consultant":
        user = await ConsultantProfile.findById(decoded.id).select("-password");
        break;
      case "customer":
        user = await CustomerProfile.findById(decoded.id).select("-password");
        if (user && !user.emailVerified) {
          return res.status(401).json({ message: "Email not verified" });
        }
        break;
      default:
        return res.status(401).json({ message: "Invalid role" });
    }

    if (!user) {
      return res.status(401).json({ message: "Not authorized, user not found" });
    }

    req.user = { ...user.toObject(), role: decoded.role };
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Session expired. Please log in again.",
        expiredAt: error.expiredAt,
      });
    }
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const socketChatAuthMiddleware = async (socket, next) => {
  const token = socket.handshake.auth.token;

  try {
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user;

    switch (decoded.role) {
      case "admin":
        user = await Admin.findById(decoded.id).select("-password");
        break;
      case "consultant":
        user = await ConsultantProfile.findById(decoded.id).select("-password");
        break;
      case "customer":
        user = await CustomerProfile.findById(decoded.id).select("-password");
        if (user && !user.emailVerified) {
          return next(new Error("Authentication error: Email not verified"));
        }
        break;
      default:
        return next(new Error("Authentication error: Invalid role"));
    }

    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    socket.user = { ...user.toObject(), role: decoded.role };
    next();
  } catch (error) {
    next(new Error(error.message));
  }
};