import express from "express";
import {
  Register,
  Login,
  Profile,
  googleAuth,
  googleCallback,
  verifyEmail,
  facebookAuth,
  facebookCallback,
  TempConsultantRegister,
  isEmailVerified
} from "../../../controllers/Consultant/authController.js";
import { protect } from "../../../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/send-verification-email", TempConsultantRegister);
router.post("/register", Register);
router.post("/login", Login);
router.get("/verify-email", verifyEmail);
router.get("/isEmailVerified", isEmailVerified);

router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);
router.get("/profile", protect, Profile);

router.get("/facebook", facebookAuth);
router.get("/facebook/callback", facebookCallback);

export default router;
