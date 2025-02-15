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
import { OAuth2Client } from "google-auth-library";
import axios from "axios";

const client = new OAuth2Client(process.env.CUSTOMER_GOOGLE_CLIENT_ID);

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
      return res
        .status(400)
        .json({ message: "The provided email is already registered." });
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

    res.status(200).json({
      message: "Verification email has been sent. Please check your inbox."
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  const { token } = req.query;

  try {
    const tempCustomerUser = await TempCustomer.findOne({
      verificationToken: token
    });

    if (!tempCustomerUser) {
      return res.status(400).json({
        message: "Verification session has expired. Please register again."
      });
    }

    tempCustomerUser.emailVerified = true;
    await tempCustomerUser.save();

    await notificationService.sendToCustomer(
      tempCustomerUser._id,
      "Email Verified Successfully",
      "Your email has been verified successfully. You can now proceed with registration."
    );

    res.status(200).json({
      message:
        "Email verified successfully. You may complete your registration."
    });
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
      return res
        .status(404)
        .json({ message: "No user found with the provided email." });
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
      return res
        .status(400)
        .json({ message: "The email is already registered." });
    }

    // Check if the email has been verified in TempCustomer
    const tempCustomerData = await TempCustomer.findOne({
      email,
      emailVerified: true
    });
    if (!tempCustomerData) {
      return res.status(400).json({
        message: "Please verify your email before completing registration."
      });
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
      message: "Registration successful",
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

export const Login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Both email and password are required." });
    }

    const user = await CustomerProfile.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Email not verified. Please verify your email to log in."
      });
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

export const googleAuthWithToken = async (req, res, next) => {
  const { access_token } = req.body;

  if (!access_token) {
    return res.status(400).json({ message: "Access token is required." });
  }

  try {
    // Get token info (email and other basic details)
    const tokenInfoResponse = await client.getTokenInfo(access_token);
    const { email, sub: googleId } = tokenInfoResponse;

    // Fetch additional user profile data from Google
    const userInfoResponse = await axios.get(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`
    );
    const { name: Name, picture: profilePhoto } = userInfoResponse.data;

    // Check if the user already exists by googleId or email
    let existingUser = await CustomerProfile.findOne({
      $or: [{ googleId }, { email }]
    });

    let message;

    if (!existingUser) {
      // Generate the customerUniqueId for new user
      const customerUniqueId = await generateCustomerUniqueId();

      // Create a new user if they don't exist
      existingUser = await CustomerProfile.create({
        Name: Name || "Google User",
        email,
        googleId,
        customerUniqueId,
        profilePhoto,
        emailVerified: true,
        isBlocked: false,
        isLoggedIn: true,
        creationDate: new Date()
      });

      message = "Registration successful.";
    } else {
      // If the user exists, update their profile
      existingUser.googleId = googleId;
      existingUser.emailVerified = true;
      existingUser.isLoggedIn = true;

      // Update profile photo if it's missing
      if (!existingUser.profilePhoto) {
        existingUser.profilePhoto = profilePhoto;
      }

      await existingUser.save();

      message = "Login successful.";
    }

    // Generate JWT
    const token = generateToken(existingUser._id, existingUser.emailVerified);

    await notificationService.sendToCustomer(
      existingUser._id,
      "Google Authentication Successful",
      "You have successfully signed in using Google."
    );

    return res.status(200).json({
      message,
      token
    });
  } catch (error) {
    console.error("Google authentication error:", error);
    return res.status(500).json({
      message: error.message,
    });

  }
};

export const facebookAuthWithToken = async (req, res, next) => {
  const { access_token } = req.body;

  if (!access_token) {
    return res.status(400).json({ message: "Access token is required." });
  }

  try {
    // Fetch user profile from Facebook using the access token
    const facebookUserInfoResponse = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${access_token}`
    );

    const { name: Name, email, id: facebookId, picture: profilePhoto } = facebookUserInfoResponse.data;

    // Check if the user already exists by Facebook ID or email
    let existingUser = await CustomerProfile.findOne({
      $or: [{ facebookId }, { email }],
    });

    let message;

    if (!existingUser) {
      // Generate the customerUniqueId for new user
      const customerUniqueId = await generateCustomerUniqueId();

      // Create a new user if they don't exist
      existingUser = await CustomerProfile.create({
        Name: Name || "Facebook User",
        email,
        facebookId,
        customerUniqueId,
        profilePhoto: profilePhoto.data.url,
        emailVerified: true,
        isBlocked: false,
        isLoggedIn: true,
        creationDate: new Date(),
      });

      message = "Registration successful.";
    } else {
      // If the user exists, update their profile
      existingUser.facebookId = facebookId;
      existingUser.emailVerified = true;
      existingUser.isLoggedIn = true;

      // Update profile photo if it's missing
      if (!existingUser.profilePhoto) {
        existingUser.profilePhoto = profilePhoto.data.url;
      }

      await existingUser.save();

      message = "Login successful.";
    }

    // Generate JWT
    const token = generateToken(existingUser._id, existingUser.emailVerified);

    // Send notification
    await notificationService.sendToCustomer(
      existingUser._id,
      "Facebook Authentication Successful",
      "You have successfully signed in using Facebook."
    );

    return res.status(200).json({
      message,
      token,
      user: {
        id: existingUser._id,
        Name: existingUser.Name,
        email: existingUser.email,
        facebookId: existingUser.facebookId,
        customerUniqueId: existingUser.customerUniqueId,
        profilePhoto: existingUser.profilePhoto,
        emailVerified: existingUser.emailVerified,
        isBlocked: existingUser.isBlocked,
        isLoggedIn: existingUser.isLoggedIn,
        creationDate: existingUser.creationDate,
      },
    });
  } catch (error) {
    console.error("Facebook authentication error:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const appleAuthWithToken = async (req, res, next) => {
  const { access_token } = req.body;

  if (!access_token) {
    return res.status(400).json({ message: "Access token is required." });
  }

  try {
    // Fetch user profile data from Apple
    const userInfoResponse = await axios.get(
      `https://appleid.apple.com/auth/token`, 
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const { sub: appleId, email } = userInfoResponse.data;
    let Name = "Apple User"; // Apple may not always provide a name
    let message;

    // Check if the user already exists by appleId or email
    let existingUser = await CustomerProfile.findOne({
      $or: [{ appleId }, { email }]
    });

    if (!existingUser) {
      // Generate the customerUniqueId for new user
      const customerUniqueId = await generateCustomerUniqueId();

      // Create a new user if they don't exist
      existingUser = await CustomerProfile.create({
        Name,
        email,
        appleId,
        customerUniqueId,
        profilePhoto: null, // Apple does not provide profile photos
        emailVerified: true,
        isBlocked: false,
        isLoggedIn: true,
        creationDate: new Date()
      });

      message = "Registration successful.";
    } else {
      // If the user exists, update their profile
      existingUser.appleId = appleId;
      existingUser.emailVerified = true;
      existingUser.isLoggedIn = true;

      await existingUser.save();
      message = "Login successful.";
    }

    // Generate JWT
    const token = generateToken(existingUser._id, existingUser.emailVerified);

    await notificationService.sendToCustomer(
      existingUser._id,
      "Apple Authentication Successful",
      "You have successfully signed in using Apple."
    );

    return res.status(200).json({
      message,
      token
    });

  } catch (error) {
    console.error("Apple authentication error:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};
