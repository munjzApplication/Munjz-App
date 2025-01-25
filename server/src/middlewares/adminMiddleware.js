import jwt from "jsonwebtoken";
import Admin from "../../src/models/Admin/adminModels/adminModel.js";

export const protectAdmin = async (req, res, next) => {
  let token;

  console.log("Checking for authorization header...");
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      console.log("Authorization header found, extracting token...");
      token = req.headers.authorization.split(" ")[1];
      console.log("Token extracted:", token);

      console.log("Verifying token...");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token verified, decoded payload:", decoded);

      console.log("Fetching admin user from database...");
      req.user = await Admin.findById(decoded.id).select("-password");

      if (!req.user) {
        console.log("Admin user not found in database.");
        return res
          .status(401)
          .json({ message: "Not authorized, admin not found" });
      }

      console.log("Admin user found:", req.user);
      next();
    } catch (error) {
      console.error("Error verifying token:", error.message);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    console.log("No authorization header or token present.");
    if (!token) {
      res.status(401).json({ message: "Not authorized, no token" });
    }
  }
};
