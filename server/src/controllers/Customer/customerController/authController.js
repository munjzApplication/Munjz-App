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
    const existingTempUser = await TempCustomer.findOne({ email });
    const existingUser = await CustomerProfile.findOne({ email });
    if (existingTempUser || existingUser) {
      return res.status(400).json({ message: "The provided email is already registered." });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const tempCustomerUser = new TempCustomer({
      Name,
      email,
      verificationToken: token,
      emailVerified: false
    });
    await tempCustomerUser.save();

    const verificationUrl = process.env.BASE_URL_CUSTOMER;
    await sendVerificationEmail(tempCustomerUser, verificationUrl);

    res.status(200).json({ message: "Verification email has been sent. Please check your inbox." });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  const { token } = req.query;

  try {
    const tempCustomerUser = await TempCustomer.findOne({ verificationToken: token });

    if (!tempCustomerUser) {
      return res.status(400).json({ message: "Verification session has expired. Please register again." });
    }

    tempCustomerUser.emailVerified = true;
    await tempCustomerUser.save();

    await notificationService.sendToCustomer(
      tempCustomerUser._id,
      "Email Verified Successfully",
      "Your email has been verified successfully. You can now proceed with registration."
    );

    res.status(200).json({ message: "Email verified successfully. You may complete your registration." });
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

    const user = await TempCustomer.findOne({ email });

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
    const { Name, email, phoneNumber, password, countryCode } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required." });
    }

    // Check if the customer is already registered
    const existingCustomer = await CustomerProfile.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({ message: "The email is already registered." });
    }

    // Check if the email has been verified in TempCustomer
    const tempCustomerData = await TempCustomer.findOne({ email, emailVerified: true });
    if (!tempCustomerData) {
      return res.status(400).json({ message: "Please verify your email before completing registration." });
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

    const newWallet = new Wallet({ customerId: newUser._id, balance: 0 });
    await newWallet.save();

    await notificationService.sendToCustomer(
      newUser._id,
      "Registration Successful",
      "Welcome to our platform! Your registration is complete."
    );

    const adminNotification = new Notification({
      notificationDetails: {
        type: "Registration",
        title: "New Customer Registration",
        message: `${Name} has successfully registered as a Customer.`,
        additionalDetails: {
          customerId: newUser._id,
          email: newUser.email,
          phoneNumber: newUser.phoneNumber,
          registrationDate: new Date()
        }
      }
    });
    await adminNotification.save();

    const token = generateToken(newUser._id, newUser.emailVerified);

    res.status(201).json({
      message: "Registration successful. Welcome!",
      token,
      user: {
        id: newUser._id,
        customerUniqueId: newUser.customerUniqueId,
        Name: newUser.Name,
        email: newUser.email,
        countryCode: newUser.countryCode,
        phoneNumber: newUser.phoneNumber,
        creationDate: newUser.creationDate
      },
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

    const user = await CustomerProfile.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    if (!user.emailVerified) {
      return res.status(403).json({ message: "Email not verified. Please verify your email to log in." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    user.isLoggedIn = true;
    await user.save();

    const token = generateToken(user._id, user.emailVerified);

    await notificationService.sendToCustomer(
      user._id,
      "Successful Login",
      "You have logged in successfully. If this wasn't you, please reset your password immediately."
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

export const googleAuth = (req, res, next) => {
  passport.authenticate("customer-google", { scope: ["profile", "email"] })(req, res, next);
};

export const googleCallback = (req, res, next) => {
  passport.authenticate("customer-google", { failureRedirect: "/" }, async (err, user, info) => {
    if (err || !user) {
      console.error("Google Authentication error:", err || info);
      return res.status(500).json({
        success: false,
        message: "Google authentication failed. Please try again.",
        error: err || info
      });
    }

    const token = generateToken(user._id, user.emailVerified);

    await notificationService.sendToCustomer(
      user._id,
      "Google Authentication Successful",
      "You have successfully signed in using Google."
    );

    res.status(200).json({
      success: true,
      message: "Google authentication successful.",
      token,
      user: {
        id: user._id,
        Name: user.Name,
        email: user.email
      }
    });
  })(req, res, next);
};

export const facebookAuth = (req, res, next) => {
  passport.authenticate("customer-facebook", { scope: ["email"] })(req, res, next);
};

export const facebookCallback = (req, res, next) => {
  passport.authenticate("customer-facebook", { failureRedirect: "/" }, async (err, user, info) => {
    if (err || !user) {
      console.error("Facebook Authentication error:", err || info);
      return res.status(500).json({
        success: false,
        message: "Facebook authentication failed. Please try again.",
        error: err || info
      });
    }

    const token = generateToken(user._id, user.emailVerified);

    await notificationService.sendToCustomer(
      user._id,
      "Facebook Authentication Successful",
      "You have successfully signed in using Facebook."
    );

    res.status(200).json({
      success: true,
      message: "Facebook authentication successful.",
      token,
      user: {
        id: user._id,
        Name: user.Name,
        email: user.email
      }
    });
  })(req, res, next);
};
