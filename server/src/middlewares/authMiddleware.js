import jwt from "jsonwebtoken";
import ConsultantProfile from "../models/Consultant/ProfileModel/User.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract token from the Authorization header
      token = req.headers.authorization.split(" ")[1];

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch the user from the database using the decoded ID
      const user = await ConsultantProfile.findById(decoded.id).select(
        "-password"
      );

      if (!user) {
        return res
          .status(404)
          .json({ message: "No user found with this token" });
      }

      // Attach the user to the request object
      req.user = user;
      next();
    } catch (error) {
      console.error(error); // Log the error for debugging purposes
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    // Handle cases where the token is missing
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};
