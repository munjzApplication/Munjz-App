import express from "express";
import { sendPasswordResetOTP, verifyOTP, resetPassword } from "../../../controllers/Consultant/ForgotPassController.js";

const router = express.Router();

// Step 1: Send OTP
router.post("/send-password-reset-otp", sendPasswordResetOTP);

// Step 2: Verify OTP
router.post("/verify-otp", verifyOTP);

// Step 3: Reset Password
router.post("/reset-password", resetPassword);

export default router;
