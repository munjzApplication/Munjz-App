import ConsultantProfile from "../../models/Consultant/ProfileModel/User.js";
import bcrypt from "bcrypt";
import passport from "passport";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendVerificationEmail } from "../../utils/email.js";
import { generateConsultantUniqueId } from "../../helper/consultant/consultantHelper.js";
import { notificationService } from "../../service/sendPushNotification.js";
import TempConsultant from "../../models/Consultant/consultantModel/tempUser.js";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import PersonalDetails from "../../models/Consultant/ProfileModel/personalDetails.js";
import IDProof from "../../models/Consultant/ProfileModel/idProof.js";
import BankDetails from "../../models/Consultant/ProfileModel/bankDetails.js";


const client = new OAuth2Client(process.env.CONSULTANT_GOOGLE_CLIENT_ID);

const generateToken = (id, emailVerified) => {
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
    const { Name, email, phoneNumber, password, countryCode } = req.body;

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
      countryCode,
      emailVerified: true,
      consultantUniqueId
    });
    await newUser.save();
    await TempConsultantData.deleteOne({ email });

    const token = generateToken(newUser._id, newUser.emailVerified);

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: newUser._id,
        Name: newUser.Name,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        countryCode: newUser.countryCode,
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
      return res.status(401).json({ message: "Incorrect email." });
    }

    if (!user.emailVerified) {
      return res
        .status(403)
        .json({ message: "Email not verified. Please verify your email to log in." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    // Check if all profile sections are completed
    const [personalDetails, bankDetails, idProof] = await Promise.all([
      PersonalDetails.findOne({ consultantId: user._id }),
      BankDetails.findOne({ consultantId: user._id }),
      IDProof.findOne({ consultantId: user._id }),
    ]);

    if (!personalDetails || !bankDetails || !idProof) {
      return res.status(403).json({
        message: "Registration successful",
        missing: {
          personalDetails: !personalDetails,
          bankDetails: !bankDetails,
          idProof: !idProof,
        },
      });
    }

    const token = generateToken(user._id, user.emailVerified);
    await notificationService.sendToCustomer(
      user._id,
      "Login Successful",
      "You have successfully logged in. If this wasn't you, secure your account by resetting your password immediately."
    );


    await notificationService.sendToAdmin(
      "Consultant Login Alert",
      `Consultant ${user.Name} (${user.email}) has logged in.`
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
    let existingUser = await ConsultantProfile.findOne({
      $or: [{ googleId }, { email }]
    });

    let message;

    if (!existingUser) {
      // Generate the customerUniqueId for new user
      const consultantUniqueId = await generateConsultantUniqueId();

      // Create a new user if they don't exist
      existingUser = await ConsultantProfile.create({
        Name: Name || "Google User",
        email,
        googleId,
        consultantUniqueId,
        profilePhoto,
        emailVerified: true,
        isBlocked: false,
        isLoggedIn: true,
        creationDate: new Date()
      });

      message = "Registration successful";
    } else {
      existingUser.googleId = googleId;
      existingUser.emailVerified = true;
      existingUser.isLoggedIn = true;

      await existingUser.save();

      message = "Login successful";
   
    
    }

    // Check if all profile sections are completed
    const [personalDetails, bankDetails, idProof] = await Promise.all([
      PersonalDetails.findOne({ consultantId: existingUser._id }),
      BankDetails.findOne({ consultantId: existingUser._id }),
      IDProof.findOne({ consultantId: existingUser._id }),
    ]);

    // If any section is missing, override the message to "Registration successful" and include missing details
    if (!personalDetails || !bankDetails || !idProof) {
      return res.status(200).json({
        message: "Registration successful",
        missing: {
          personalDetails: !personalDetails,
          bankDetails: !bankDetails,
          idProof: !idProof,
        },
      });
    }

    // Generate JWT
    const token = generateToken(existingUser._id, existingUser.emailVerified);

    await notificationService.sendToConsultant(
      existingUser._id,
      "Google Authentication Successful",
      "You have successfully signed in using Google."
    );
    await notificationService.sendToAdmin(
      "Consultant Login Alert",
      `Consultant ${existingUser.Name} (${existingUser.email}) just logged in using Google.`
    );

    return res.status(200).json({
      message,
      token,
      user: {
        id: existingUser._id,
        Name: existingUser.Name,
        email: existingUser.email,
      }
    });
  } catch (error) {
    console.error("Google authentication error:", error);
    next(error);
  }
};

export const facebookAuthWithToken = async (req, res, next) => {
  const { access_token } = req.body;
  console.log("access_token received:", access_token);

  if (!access_token) {
    return res.status(400).json({ message: "Access token is required." });
  }

  try {
    let facebookUserInfo;

    // Check if the token is a JWT (ID token)
    if (access_token.split(".").length === 3) {
      // Decode the JWT token
      const decodedToken = jwt.decode(access_token);
      if (!decodedToken) {
        return res.status(401).json({ message: "Invalid Facebook ID token." });
      }

      // Extract user info from the decoded token
      facebookUserInfo = {
        id: decodedToken.sub,
        name: decodedToken.name,
        email: decodedToken.email,
        picture: { data: { url: decodedToken.picture } }
      };
    } else {
      // If it's not a JWT, assume it's a standard Facebook access token
      const facebookUserInfoResponse = await axios.get(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${access_token}`
      );

      // If Facebook responds with an error, it means the token is invalid
      if (
        !facebookUserInfoResponse.data ||
        facebookUserInfoResponse.data.error
      ) {
        return res
          .status(401)
          .json({ message: "Invalid Facebook access token." });
      }

      facebookUserInfo = facebookUserInfoResponse.data;
    }

    const {
      name: Name,
      email,
      id: facebookId,
      picture: profilePhoto
    } = facebookUserInfo;

    // Check if the user already exists by Facebook ID or email
    let existingUser = await ConsultantProfile.findOne({
      $or: [{ facebookId }, { email }]
    });

    let message;

    if (!existingUser) {
      // Generate the customerUniqueId for new user
      const consultantUniqueId = await generateConsultantUniqueId();

      // Create a new user if they don't exist
      existingUser = await ConsultantProfile.create({
        Name: Name || "Facebook User",
        email,
        facebookId,
        consultantUniqueId,
        profilePhoto: profilePhoto?.data?.url,
        emailVerified: true,
        isBlocked: false,
        isLoggedIn: true,
        creationDate: new Date()
      });

      message = "Registration successful";
        // Notify on registration
        await notificationService.sendToCustomer(
          existingUser._id,
          "Welcome to MUNJZ",
          "Your registration was successful. Welcome aboard!"
        );
        await notificationService.sendToAdmin(
          "New Consultant Registration",
          `A new Consultant ${existingUser.Name} (${existingUser.email}) has registered using Apple.`
        );
    } else {
      // If the user exists, update their profile
      existingUser.facebookId = facebookId;
      existingUser.emailVerified = true;
      existingUser.isLoggedIn = true;

      await existingUser.save();
      message = "Login successful";
      // Notify on login
      await notificationService.sendToConsultant(
        existingUser._id,
        "Welcome back",
        "You have successfully logged in using Facebook."
      );
      await notificationService.sendToAdmin(
        "Consultant Login Alert",
        `Consultant ${existingUser.Name} (${existingUser.email}) just logged in using Facebook.`
      );
    
    }

    // Generate JWT
    const token = generateToken(existingUser._id, existingUser.emailVerified);

    // Send notification
    await notificationService.sendToConsultant(
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

      }
    });
  } catch (error) {
    console.error("Facebook authentication error:", error);

    // Handle different Facebook API errors
    if (error.response && error.response.data && error.response.data.error) {
      return res
        .status(401)
        .json({ message: "Invalid or expired Facebook access token." });
    }

    next(error);
  }
};

export const appleAuthWithToken = async (req, res, next) => {
  const { identity_token, name } = req.body;

  if (!identity_token) {
    return res.status(400).json({ message: "Identity token is required." });
  }

  try {
    // Decode the Apple ID token
    const decoded = jwt.decode(identity_token, { complete: true });
    if (!decoded) {
      return res.status(400).json({ message: "Invalid identity token." });
    }

    const { email, sub: appleId } = decoded.payload;

    // Extract name (if provided)
    let Name = name || "null";
    // let defaultProfilePic = "/assets/profile.jpg";

    // Check if the user already exists
    let existingUser = await ConsultantProfile.findOne({
      $or: [{ appleId }, { email }]
    });

    let message;

    if (!existingUser) {
      // Generate unique ID for new user
      const consultantUniqueId = await generateConsultantUniqueId();

      existingUser = await ConsultantProfile.create({
        Name, // Store name if available
        email,
        appleId,
        consultantUniqueId,
        emailVerified: true,
        isBlocked: false,
        isLoggedIn: true,
        creationDate: new Date(),
        profilePhoto: null
      });

      message = "Registration successful";
        // Notify on registration
        await notificationService.sendToConsultant(
          existingUser._id,
          "Welcome to MUNJZ",
          "Your registration was successful. Welcome aboard!"
        );
        await notificationService.sendToAdmin(
          "New Consultant Registration",
          `A new Consultant ${existingUser.Name} (${existingUser.email}) has registered using Apple.`
        );
    } else {
      // If the user exists, update their profile
      existingUser.appleId = appleId;
      existingUser.emailVerified = true;
      existingUser.isLoggedIn = true;

      // Update name only if it's the first login (name isn't saved yet)
      if (!existingUser.Name || existingUser.Name === "null") {
        existingUser.Name = Name;
      }

      await existingUser.save();
      message = "Login successful";
      // Notify on login
      await notificationService.sendToConsultant(
        existingUser._id,
        "Welcome back",
        "You have successfully logged in using Apple."
      );
      await notificationService.sendToAdmin(
        "Consultant Login Alert",
        `Consultant ${existingUser.Name} (${existingUser.email}) just logged in using Apple.`
      );
    
    }

    // Generate JWT
    const token = generateToken(existingUser._id, existingUser.emailVerified);

    // Send notification
    await notificationService.sendToConsultant(
      existingUser._id,
      "Apple Authentication Successful",
      "You have successfully signed in using Apple."
    );

    return res.status(200).json({
      message,
      token,
      user: {
        id: existingUser._id,
        Name: existingUser.Name,
        email: existingUser.email,

      }
    });
  } catch (error) {
    console.error("Apple authentication error:", error);

    next(error);
  }
};

