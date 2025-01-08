import ConsultantProfile from "../../models/Consultant/User.js";
import bcrypt from "bcrypt";
import passport from "passport";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "../../utils/email.js";
import { generateConsultantUniqueId } from "../../helper/consultant/consultantHelper.js";
import Notification from "../../models/Admin/notificationModels/notificationModel.js";

const generateToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

export const Register = async (req, res, next) => {
  try {
    const { Name, email, phoneNumber, password } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required." });
    }

    const existingUser = await ConsultantProfile.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const consultantUniqueId = await generateConsultantUniqueId();

    const newUser = new ConsultantProfile({
      Name,
      email,
      phoneNumber,
      password: hashedPassword,
      emailVerified: false,
      consultantUniqueId
    });

    await newUser.save();
    await sendVerificationEmail(newUser, process.env.BASE_URL_CONSULTANT);

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
      message:
        "User registered successfully. Please check your email for verification.",
      token,
      user: {
        id: newUser._id,
        Name: newUser.Name,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        consultantUniqueId,
        creationDate: newUser.creationDate
      }
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

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await ConsultantProfile.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User noty found." });
    }

    // Update email verification status
    user.emailVerified = true;
    await user.save();

    res.status(200).json({
      message: "Email verified successfully!",
      user: {
        id: user._id,
        Name: user.Name,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
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
