import express from "express";
import { sendPasswordResetOTP,resetPassword } from "../../../controllers/Consultant/ForgotPassController.js";

const router = express.Router();

router.post("/send-password-reset-otp", sendPasswordResetOTP); 
router.post("/reset-password", resetPassword); 


export default router;