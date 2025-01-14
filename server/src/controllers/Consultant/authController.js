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

export const TempConsultantRegister = async (req, res, next) => {
  const { Name, email } = req.body;

  try {
    // Check if user already exists in TempUsers or Users
    const existingTempUser = await TempUser.findOne({ email });
    const existingUser = await ConsultantProfile.findOne({ email });
    if (existingTempUser || existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString("hex");

    // Save user data in TempUser collection
    const tempUser = new TempUser({
      Name,
      email,
      verificationToken: token,
      emailVerified: false // Always set to false initially
    });
    await tempUser.save();

    // Send verification email
    const verificationUrl = process.env.BASE_URL_CONSULTANT;
    await sendVerificationEmail(tempUser, verificationUrl); // Pass the URL to the email helper function

    res.status(200).json({ message: "Verification email sent." });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  const { token } = req.query;

  try {
    // Find the temp user by token
    const tempUser = await TempUser.findOne({ verificationToken: token });
    if (!tempUser) {
      return res.status(400).json({ message: "session expired" });
    }
    tempUser.emailVerified = true;
    await tempUser.save();

    res
      .status(200)
      .json({ message: "Email verified and registration complete." });
  } catch (error) {
    next(error);
  }
};

export const isEmailVerified = async (req, res, next) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await TempUser.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.emailVerified) {
      return res.status(200).json({ message: "Email is verified.", emailVerified: true });
    } else {
      return res.status(200).json({ message: "Email is not verified.", emailVerified: false });
    }
  } catch (error) {
    next(error); 
  }
};

export const Register = async (req, res, next) => {
  try {
    const { Name, email, phoneNumber, password } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required." });
    }

    // Check if the user exists in ConsultantProfile and is verified
    const TempUserData = await TempUser.findOne({ email, emailVerified: true });

    if (!TempUserData || !TempUserData.emailVerified) {
      return res
        .status(400)
        .json({ message: "Please verify your email first." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const consultantUniqueId = await generateConsultantUniqueId();
    const newUser = new ConsultantProfile({
      Name,
      email,
      phoneNumber,
      password: hashedPassword,
      emailVerified: true,
      consultantUniqueId
    });
    await newUser.save();
    await TempUser.deleteOne({ email });
    // Send notification for new consultant registration
    const notification = new Notification({
      notificationDetails: {
        type: "Registration",
        title: "New Consultant Registration",
        message: `${Name} has successfully registered as a consultant.`,
        additionalDetails: {
          consultantId: newUser._id,
          email: newUser.email,
          phoneNumber: newUser.phoneNumber,
          registrationDate: new Date()
        }
      }
    });
    await notification.save();

    const token = generateToken(newUser._id);

    res.status(201).json({
      message: "User registered successfully.",
      token,
      newUser
    });
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

export const googleCallback = (req, res, next) => {
  passport.authenticate(
    "consultant-google",
    { failureRedirect: "/" },
    async (err, user, info) => {
      if (err) {
        console.error("Authentication error:", err);
        return res.status(500).json({
          success: false,
          message: "Authentication error",
          error: err
        });
      }

      if (!user) {
        console.warn("User not found:", info);
        return res
          .status(401)
          .json({ success: false, message: "User not found" });
      }

      const token = generateToken(user._id);

      res.status(200).json({
        success: true,
        message: "Authentication successful!",
        token,
        user: {
          id: user._id,
          Name: user.Name,
          email: user.email
        }
      });
    }
  )(req, res, next);
};

export const Profile = (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  res.json({
    success: true,
    user: {
      Name: req.user.Name,
      email: req.user.email,
      profilePhoto: req.user.profilePhoto
    }
  });
};

export const facebookAuth = (req, res, next) => {
  passport.authenticate("consultant-facebook", { scope: ["email"] })(
    req,
    res,
    next
  );
};

export const facebookCallback = (req, res, next) => {
  passport.authenticate(
    "consultant-facebook",
    { failureRedirect: "/" },
    async (err, user, info) => {
      if (err) {
        console.error("Facebook Authentication error:", err);
        return res.status(500).json({
          success: false,
          message: "Facebook authentication failed.",
          error: err
        });
      }

      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "User not found." });
      }

      const token = generateToken(user._id);

      res.status(200).json({
        success: true,
        message: "Facebook authentication successful!",
        token,
        user: {
          id: user._id,
          Name: user.Name,
          email: user.email
        }
      });
    }
  )(req, res, next);
};
