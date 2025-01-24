import express from "express";
import { sendPasswordResetOTP, verifyOTP, resetPassword } from "../../../controllers/Consultant/ForgotPassController.js";

const router = express.Router();


router.post("/send-password-reset-otp", sendPasswordResetOTP);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

export default router;
