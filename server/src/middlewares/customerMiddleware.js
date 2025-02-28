import jwt from 'jsonwebtoken';
import CustomerProfile from '../models/Customer/customerModels/customerModel.js';

export const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; 

  if (!token) {
    return res.status(401).json({ message: "No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 
    console.log("jwt",token);
    
    req.user = await CustomerProfile.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ message: "User not found." });
    }

    if (!req.user.emailVerified) {
      return res.status(401).json({ message: "Email not verified." });
    }

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error("Token verification error:", error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: "Session expired. Please log in again.",
        expiredAt: error.expiredAt,
      });
    }

    return res.status(401).json({ message: "Invalid or expired token." });
  }
};
