import CustomerProfile from "../../../models/Customer/customerModels/customerModel.js";
import bcrypt from "bcrypt";
import passport from "passport";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendVerificationEmail } from "../../../utils/email.js";
import { generateCustomerUniqueId } from "../../../helper/customer/customerHelper.js";
import Wallet from "../../../models/Customer/customerModels/walletModel.js";
import Notification from "../../../models/Admin/notificationModels/notificationModel.js";
import { notificationService } from "../../../service/sendPushNotification.js";
import TempCustomer from "../../../models/Customer/customerModels/TempCustomerModel.js";
const generateToken = (id, emailVerified) => {
  return jwt.sign({ id, emailVerified }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

export const TempCustomerRegister = async (req, res, next) => {
  const { Name, email } = req.body;

  try {
    // Check if user already exists in TempUsers or Users
    const existingTempUser = await TempCustomer.findOne({ email });
    const existingUser = await CustomerProfile.findOne({ email });
    if (existingTempUser || existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString("hex");

    // Save user data in TempUser collection
    const tempconstomerUser = new TempCustomer({
      Name,
      email,
      verificationToken: token,
      emailVerified: false // Always set to false initially
    });
    await tempconstomerUser.save();

    // Send verification email
    const verificationUrl = process.env.BASE_URL_CUSTOMER;
    await sendVerificationEmail(tempconstomerUser, verificationUrl); // Pass the URL to the email helper function

    res.status(200).json({ message: "Verification email sent." });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  const { token } = req.query;

  try {
    // Find the temp user by token
    const tempconstomerUser = await TempCustomer.findOne({
      verificationToken: token
    });

    if (!tempconstomerUser) {
      return res.status(400).json({ message: "session expired" });
    }
    tempconstomerUser.emailVerified = true;
    await tempconstomerUser.save();

    res
      .status(200)
      .json({ message: "Email verified and registration complete." });
  } catch (error) {
    next(error);
  }
};

export const Register = async (req, res, next) => {
  try {
    const { Name, email, phoneNumber, password, countryCode } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required." });
    }

    const TempCustomerData = await TempCustomer.findOne({
      email,
      emailVerified: true
    });

    if (!TempCustomerData || !TempCustomerData.emailVerified) {
      return res
        .status(400)
        .json({ message: "Please verify your email first." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const customerUniqueId = await generateCustomerUniqueId();

    const newUser = new CustomerProfile({
      Name,
      email,
      phoneNumber,
      countryCode,
      password: hashedPassword,
      emailVerified: true,
      customerUniqueId
    });

    await newUser.save();
    await TempCustomer.deleteOne({ email });
    const newWallet = new Wallet({
      customerId: newUser._id,
      balance: 0
    });

    await newWallet.save();

    await sendVerificationEmail(newUser, process.env.BASE_URL_CUSTOMER);

    await notificationService.sendToCustomer(
      newUser._id,
      "Welcome to Our Platform",
      "Please verify your email to complete registration",
      {
        type: "registration",
        status: "pending_verification",
        customerId: newUser._id.toString()
      }
    );

    const token = generateToken(newUser._id, newUser.emailVerified);

    res.status(201).json({
      message:
        "User registered successfully. Please check your email for verification.",
      token,
      user: {
        id: newUser._id,
        customerUniqueId: newUser.customerUniqueId,
        Name: newUser.Name,
        email: newUser.email,
        countryCode: newUser.countryCode,
        phoneNumber: newUser.phoneNumber,
        creationDate: newUser.creationDate
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login
export const Login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and Password are required." });
    }

    const user = await CustomerProfile.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({
        message:
          "Your email is not verified. Please verify your email to log in."
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Update `isLoggedIn` field
    user.isLoggedIn = true;
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id, user.emailVerified);

    // Notify the customer about the successful login
    await notificationService.sendToCustomer(
      user._id,
      "Login Successful",
      "You have successfully logged into your account. If this wasn't you, please reset your password immediately.",
      {
        type: "login",
        status: "completed",
        customerId: user._id.toString()
      }
    );

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        customerUniqueId: user.customerUniqueId,
        Name: user.Name,
        email: user.email,
        countryCode: user.countryCode,
        phoneNumber: user.phoneNumber,
        creationDate: user.creationDate
      }
    });
  } catch (error) {
    next(error);
  }
};

// Google Authentication
export const googleAuth = (req, res, next) => {
  passport.authenticate("customer-google", { scope: ["profile", "email"] })(
    req,
    res,
    next
  );
};

// Google Authentication Callback
export const googleCallback = (req, res, next) => {
  passport.authenticate(
    "customer-google",
    { failureRedirect: "/" },
    async (err, user, info) => {
      if (err || !user) {
        console.error("Google Authentication error:", err || info);
        return res.status(500).json({
          success: false,
          message: "Google authentication failed.",
          error: err || info
        });
      }

      const token = generateToken(user._id);

      res.status(200).json({
        success: true,
        message: "Google authentication successful!",
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

// Facebook Authentication
export const facebookAuth = (req, res, next) => {
  passport.authenticate("customer-facebook", { scope: ["email"] })(
    req,
    res,
    next
  );
};

// Facebook Authentication Callback
export const facebookCallback = (req, res, next) => {
  passport.authenticate(
    "customer-facebook",
    { failureRedirect: "/" },
    async (err, user, info) => {
      if (err || !user) {
        console.error("Facebook Authentication error:", err || info);
        return res.status(500).json({
          success: false,
          message: "Facebook authentication failed.",
          error: err || info
        });
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
