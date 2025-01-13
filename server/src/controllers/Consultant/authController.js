import ConsultantProfile from "../../models/Consultant/User.js";
import bcrypt from "bcrypt";
import passport from "passport";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendVerificationEmail } from "../../utils/email.js";
import { generateConsultantUniqueId } from "../../helper/consultant/consultantHelper.js";
import Notification from "../../models/Admin/notificationModels/notificationModel.js";
import TempUser from "../../models/Consultant/tempUser.js";

const generateToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

export const Register = async (req, res, next) => {
  try {
    const { Name, email, phoneNumber, password } = req.body;

    // Check if the user already exists in TempUser or ConsultantProfile
    const existingTempUser = await TempUser.findOne({ email });
    const existingUser = await ConsultantProfile.findOne({ email });
    if (existingTempUser || existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Save user data in TempUser collection
    const tempUser = new TempUser({
      Name,
      email,
      phoneNumber,
      password: hashedPassword, // Store the hashed password
      verificationToken,
      emailVerified: false,
    });
    await tempUser.save();

    const verificationUrl = process.env.BASE_URL_CONSULTANT
    await sendVerificationEmail(tempUser, verificationUrl);

    res.status(201).json({
      message: "Registration initiated. Please verify your email to complete the process.",
    });
  } catch (error) {
    next(error);
  }
};


export const verifyEmailAndCompleteRegistration = async (req, res, next) => {
  const { token } = req.query;

  try {
    // Find user in TempUser collection
    const tempUser = await TempUser.findOne({ verificationToken: token });
    if (!tempUser) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    // Transfer data to ConsultantProfile
    const newUser = new ConsultantProfile({
      Name: tempUser.Name,
      email: tempUser.email,
      phoneNumber: tempUser.phoneNumber,
      password: tempUser.password, // Already hashed
      emailVerified: true,
      consultantUniqueId: await generateConsultantUniqueId(),
    });
    await newUser.save();

    // Delete tempUser after successful creation
    await TempUser.deleteOne({ _id: tempUser._id });

    res.status(200).json({ message: "Email verified and registration complete." });
  } catch (error) {
    next(error);
  }
};


export const Login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and Password are required" });
    }

    const user = await ConsultantProfile.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.emailVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email before logging in." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id);
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        Name: user.Name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        consultantUniqueId: user.consultantUniqueId,
        creationDate: user.creationDate
      }
    });
  } catch (error) {
    next(error);
  }
};


export const googleAuth = (req, res, next) => {
  passport.authenticate("consultant-google", { scope: ["profile", "email"] })(
    req,
    res,
    next
  );
};
export const googleCallback = async (req, res, next) => {
  passport.authenticate(
    "consultant-google",
    { failureRedirect: "/" },
    async (err, user, info) => {
      try {
        if (err || !user) {
          console.error("Google Authentication error:", err || info);
          return res.status(500).json({
            success: false,
            message: "Google authentication failed.",
            error: err || info,
          });
        }
  

      
        // Generate a token for the user
        const token = generateToken(user._id);

        res.status(200).json({
          success: true,
          message: "Google authentication successful!",
          token,
          user
        });
      } catch (error) {
        next(error);
      }
    }
  )(req, res, next);
};


export const facebookAuth = (req, res, next) => {
  passport.authenticate("consultant-facebook", { scope: ["email"] })(
    req,
    res,
    next
  );
};
export const facebookCallback = async (req, res, next) => {
  passport.authenticate(
    "consultant-facebook",
    { failureRedirect: "/" },
    async (err, user, info) => {
      try {
        if (err || !user) {
          console.error("Facebook Authentication error:", err || info);
          return res.status(500).json({
            success: false,
            message: "Facebook authentication failed.",
            error: err || info,
          });
        }


        // Generate a token for the user
        const token = generateToken(existingUser._id);

        res.status(200).json({
          success: true,
          message: "Facebook authentication successful!",
          token,
          user
        });
      } catch (error) {
        next(error);
      }
    }
  )(req, res, next);
};
