import customerProfile from "../../../models/Customer/customerModels/customerModel.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { notificationService } from "../../../service/sendPushNotification.js";

export const sendPasswordResetOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find customer profile
    const customer = await customerProfile.findOne({ email });

    // Always respond with a success message, regardless of whether the customer exists
    if (!customer) {
      return res.status(200).json({
        message: "If this email is registered, you will receive an OTP shortly."
      });
    }

    // Generate a secure random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // Store OTP hash and expiration time (10 minutes)
    customer.resetOtpHash = otpHash;
    customer.resetOtpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await customer.save();

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

    res.status(200).json({
      message: "If this email is registered, you will receive an OTP shortly."
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const customer = await customerProfile.findOne({ email });
    if (!customer) {
      return res
        .status(400)
        .json({ message: "Invalid email or OTP. Please try again." });
    }

    // Verify the OTP hash and expiration
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    if (
      !customer.resetOtpHash ||
      customer.resetOtpExpiry < Date.now() ||
      customer.resetOtpHash !== otpHash
    ) {
      return res
        .status(400)
        .json({ message: "Invalid or expired OTP. Please request a new one." });
    }

    // Hash the new password and save
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    customer.password = hashedPassword;
    customer.resetOtpHash = undefined; // Clear OTP after use
    customer.resetOtpExpiry = undefined;
    await customer.save();

    // Send notification
    try {
      await notificationService.sendToCustomer(
        customer._id,
        "Password Reset",
        "Your password has been reset successfully.",
        {}
      );
    } catch (pushError) {
      console.error("Error sending password reset notification:", pushError);
    }

    res.status(200).json({
      message:
        "Password has been reset successfully. You can now log in with your new password."
    });
  } catch (error) {
    next(error);
  }
};
