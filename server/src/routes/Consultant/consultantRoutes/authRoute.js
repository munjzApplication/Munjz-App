import express from "express";
import {
  Register,
  Login,
  verifyEmail,
  googleAuthWithToken,
  facebookAuthWithToken,
  appleAuthWithToken,
  TempConsultantRegister,
  isEmailVerified
} from "../../../controllers/Consultant/authController.js";


const router = express.Router();

router.post("/send-verification-email", TempConsultantRegister);
router.get("/verify-email", verifyEmail);
router.post("/isEmailVerified", isEmailVerified);

router.post("/register", Register);
router.post("/login", Login);

router.post("/google/callback", googleAuthWithToken);
router.post("/facebook/callback", facebookAuthWithToken);
router.post("/apple/callback",appleAuthWithToken);

export default router;
