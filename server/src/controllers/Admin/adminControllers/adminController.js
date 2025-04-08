import Admin from "../../../models/Admin/adminModels/adminModel.js";
import jwt from "jsonwebtoken";

export const Login = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });


    if (!admin) return res.status(404).json({ message: "Admin not found" });

    if (admin.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );


    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    next(error);
  }
};
