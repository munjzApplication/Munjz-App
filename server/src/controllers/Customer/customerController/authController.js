import CustomerProfile from "../../../models/Customer/customerModels/customerModel.js";
import bcrypt from "bcrypt";
import passport from "passport";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "../../../utils/email.js";
import { generateCustomerUniqueId } from "../../../helper/customer/customerHelper.js";
import Wallet from "../../../models/Customer/customerModels/walletModel.js";
import Notification from "../../../models/Admin/notificationModels/notificationModel.js";
import { notificationService } from "../../../service/sendPushNotification.js";

const generateToken = (id, emailVerified) => {
  return jwt.sign({ id, emailVerified }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

export const Register = async (req, res, next) => {
  try {
    const { Name, email, phoneNumber, password, countryCode } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required." });
    }

    const existingUser = await CustomerProfile.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const customerUniqueId = await generateCustomerUniqueId();

    const newUser = new CustomerProfile({
      Name,
      email,
      phoneNumber,
      countryCode,
      password: hashedPassword,
      emailVerified: false,
      customerUniqueId
    });

    await newUser.save();

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
          "Your email is not verified. Please verify your email to log in.",
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
        customerId: user._id.toString(),
      }
    );

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        email: user.email,
        isLoggedIn: user.isLoggedIn,
      },
    });
  } catch (error) {
    next(error);
  }
};


// Google Authentication Initiation
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
        return res.status(500).json({
          success: false,
          message: "Authentication failed",
          error: err || info
        });
      }

      const token = generateToken(user._id, user.emailVerified);

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

// Profile Endpoint
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

// Email Verification
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await CustomerProfile.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: "Email already verified." });
    }

    user.emailVerified = true;
    await user.save();

    // Send notification to customer
    await notificationService.sendToCustomer(
      user._id,
      "Email Verified Successfully",
      "Your account is now fully activated. Welcome aboard!",
      {
        type: "email_verification",
        status: "completed",
        customerId: user._id.toString(),
      }
    );

    // Send notification to admin
    await notificationService.sendToAdmin(
      "New Customer Verified",
      `Customer ${user.Name} has verified their email`,
      {
        type: "customer_verification",
        customerId: user._id.toString(),
        customerName: user.Name,
        customerEmail: user.email,
        customerPhone: user.phoneNumber,
      }
    );

    const notification = new Notification({
      notificationDetails: {
        message: "Customer registered",
        customerName: user.Name,
        customerEmail: user.email,
        customerPhone: user.phoneNumber,
      },
    });
    await notification.save();

    res.status(200).json({
      message: "Email verified successfully!",
      user: {
        id: user._id,
        Name: user.Name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};


export const facebookAuth = (req, res , next) => {
  passport.authenticate("customer-facebook" , { sxope: ["email"]})(req, res , next);
};

export const facebookCallback = (req, res, next) => {
  passport.authenticate(
    "customer-facebook",
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

