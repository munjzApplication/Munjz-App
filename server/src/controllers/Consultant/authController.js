import ConsultantProfile from "../../models/Consultant/User.js";
import bcrypt from "bcrypt";
import passport from "passport";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendVerificationEmail } from "../../utils/email.js";
import { generateConsultantUniqueId } from "../../helper/consultant/consultantHelper.js";
import Notification from "../../models/Admin/notificationModels/notificationModel.js";
import { notificationService } from "../../service/sendPushNotification.js";
import TempConsultant from "../../models/Consultant/tempUser.js";

const generateToken = (id , emailVerified) => {
  return jwt.sign({ id, emailVerified }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

export const TempConsultantRegister = async (req, res, next) => {
  const { Name, email } = req.body;

  try {
    const existingTempUser = await TempConsultant.findOne({ email });
    const existingUser = await ConsultantProfile.findOne({ email });
    if (existingTempUser || existingUser) {
      return res.status(400).json({ message: "The provided email is already registered." });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const tempUser = new TempConsultant({
      Name,
      email,
      verificationToken: token,
      emailVerified: false
    });
    await tempUser.save();

    // Send verification email
    const verificationUrl = process.env.BASE_URL_CONSULTANT;
    await sendVerificationEmail(tempUser, verificationUrl);

    res.status(200).json({ message: "Verification email has been sent. Please check your inbox." });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  const { token } = req.query;

  try {
    const tempUser = await TempConsultant.findOne({ verificationToken: token });
    if (!tempUser) {
      return res.status(400).json({ message: "Verification session has expired. Please register again." });
    }
    tempUser.emailVerified = true;
    await tempUser.save();

      await notificationService.sendToConsultant(
        TempConsultant._id,
          "Email Verified Successfully",
          "Your email has been verified successfully. You can now proceed with registration."
        );

    res
      .status(200)
      .json({ message: "Email verified successfully. You may complete your registration." });
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

    const user = await TempConsultant.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "No user found with the provided email." });
    }

    const message = user.emailVerified
      ? "Email is verified."
      : "Email is not verified. Please verify to continue.";
    res.status(200).json({ message, emailVerified: user.emailVerified });
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

        // Check if the customer is already registered
        const existingCustomer = await ConsultantProfile.findOne({ email });
        if (existingCustomer) {
          return res.status(400).json({ message: "The email is already registered." });
        }

    const TempConsultantData = await TempConsultant.findOne({
      email,
      emailVerified: true
    });

    if (!TempConsultantData) {
      return res.status(400).json({ message: "Please verify your email before completing registration." });
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
    await TempConsultantData.deleteOne({ email });

    await notificationService.sendToConsultant(
      newUser._id,
      "Registration Successful",
      "Welcome to our platform! Your registration is complete."
    );
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

    const token = generateToken(newUser._id , newUser.emailVerified);

    res.status(201).json({
      message: "Registration successful. Welcome!",
      token,
      user : {
        id: newUser._id,
        Name: newUser.Name,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        consultantUniqueId: newUser.consultantUniqueId,
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
      return res.status(400).json({ message: "Both email and password are required." });
    }

    const user = await ConsultantProfile.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    if (!user.emailVerified) {
      return res
        .status(403)
        .json({ message: "Email not verified. Please verify your email to log in." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    const token = generateToken(user._id , user.emailVerified);

    await notificationService.sendToConsultant(
      user._id,
      "Successful Login",
      "You have logged in successfully. If this wasn't you, please reset your password immediately."
    );

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
            message: "Google authentication failed. Please try again.",
            error: err || info
          });
        }

        // Generate a token for the user
        const token = generateToken(user._id , user.emailVerified);

        await notificationService.sendToConsultant(
          user._id,
          "Google Authentication Successful",
          "You have successfully signed in using Google."
        );

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
            message: "Facebook authentication failed. Please try again.",
            error: err || info
          });
        }

        // Generate a token for the user
        const token = generateToken(user._id , user.emailVerified);

        await notificationService.sendToConsultant(
          user._id,
          "Facebook Authentication Successful",
          "You have successfully signed in using Facebook."
        );

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
