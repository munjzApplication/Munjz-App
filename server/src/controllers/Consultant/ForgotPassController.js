import ConsultantProfile from "../../models/Consultant/ProfileModel/User.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { notificationService } from "../../service/sendPushNotification.js";

export const sendPasswordResetOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    const consultant = await ConsultantProfile.findOne({ email });

    // Always respond with a success message, regardless of whether the consultant exists
    if (!consultant) {
      return res.status(200).json({
        message: "If this email is registered, you will receive an OTP shortly."
      });
    }

    // Generate a secure random OTP (4 digits)
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // Store OTP hash and expiration time (10 minutes)
    consultant.resetOtpHash = otpHash;
    consultant.resetOtpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await consultant.save();

    // Send the OTP via email
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      to: email,
      subject: "Password Reset OTP",
      html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset OTP</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 20px;
                background-color: #f9f9f9;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: #fff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              }
              h1 {
                color: #2D467C;
              }
              .otp {
                font-size: 24px;
                color: #2D467C;
                font-weight: bold;
                margin: 20px 0;
              }
              .footer {
                color: #666;
                font-size: 12px;
              }
              .footer a {
                color: #2D467C;
                text-decoration: none;
              }
              .cta-button {
                display: inline-block;
                margin: 20px 0;
                padding: 10px 20px;
                color: #fff;
                background-color: #2D467C;
                text-decoration: none;
                border-radius: 5px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Password Reset Request</h1>
              <p>We received a request to reset your password. Please use the OTP below to proceed:</p>
              <div class="otp">${otp}</div>
              <p>The OTP is valid for <strong>10 minutes</strong>.</p>
              <p>If you didn’t request this, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>Thank you,<br>Your Support Team</p>
            </div>
          </body>
          </html>
        `
    });
    await notificationService.sendToConsultant(
      consultant._id,
      "Password Reset Request",
      "An OTP has been sent to your email for password reset. It is valid for 10 minutes.",
      {}
    );

    res.status(200).json({
      message: "If this email is registered, you will receive an OTP shortly."
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // Fetch the consultant by email
    const consultant = await ConsultantProfile.findOne({ email });
    if (!consultant) {
      return res
        .status(400)
        .json({ message: "Invalid email or OTP. Please try again." });
    }


    // Check if OTP has expired
    if (consultant.resetOtpExpiry < Date.now()) {
      // Send notification for OTP expiration
      try {
        await notificationService.sendToConsultant(
          consultant._id,
          "OTP Expired",
          "Your OTP has expired. Please request a new one to reset your password.",
          {}
        );
      } catch (pushError) {
        console.error("Error sending OTP expired notification:", pushError);
      }
      return res.status(400).json({
        message: "OTP has expired. Please request a new one."
      });
    }

    // Generate hash of the entered OTP
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // Compare the stored OTP hash with the generated one
    if (consultant.resetOtpHash !== otpHash) {
      try {
        await notificationService.sendToConsultant(
          consultant._id,
          "Invalid OTP Attempt",
          "An incorrect OTP was entered. If this wasn't you, please request a new OTP.",
          {}
        );
      } catch (pushError) {
        console.error("Error sending invalid OTP notification:", pushError);
      }
      return res
        .status(400)
        .json({ message: "Invalid OTP. Please try again." });
    }

    // OTP is correct, clear hash and expiry
    consultant.resetOtpHash = undefined;
    consultant.resetOtpExpiry = undefined;
    await consultant.save();

    try {
      await notificationService.sendToConsultant(
        consultant._id,
        "OTP Verified",
        "Your OTP has been verified successfully. You can now reset your password.",
        {}
      );
    } catch (pushError) {
      console.error("Error sending OTP verified notification:", pushError);
    }
    res.status(200).json({
      message: "OTP verified successfully. You can now reset your password."
    });
  } catch (error) {
    console.error("Error in verifyOTP function:", error.message);
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    const consultant = await ConsultantProfile.findOne({ email });
    if (!consultant) {
      return res
        .status(400)
        .json({ message: "Invalid email. Please try again." });
    }

    // Hash the new password and save it
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    consultant.password = hashedPassword;

    await consultant.save();

    // Send notification
    try {
      await notificationService.sendToConsultant(
        consultant._id,
        "Password Reset",
        "Your password has been reset successfully.",
        {}
      );
    } catch (pushError) {
      console.error("Error sending password reset notification:", pushError);
    }
    // Notify Admin (Optional)
    try {
      await notificationService.sendToAdmin(
        "Consultant Password Reset",
        `Consultant ${consultant.email} has reset their password.`,
      );
    } catch (adminNotifyError) {
      console.error("Error sending password reset notification to admin:", adminNotifyError);
    }

    res.status(200).json({
      message:
        "Password has been reset successfully. You can now log in with your new password."
    });
  } catch (error) {
    next(error);
  }
};
