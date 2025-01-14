import express from "express";
import {
  Register,
  Login,
  googleAuth,
  googleCallback,
  verifyEmail,
  facebookAuth,
  facebookCallback,
  TempCustomerRegister,
  isEmailVerified
} from "../../../controllers/Customer/customerController/authController.js";


const router = express.Router();

router.post("/send-verification-email", TempCustomerRegister);
router.get("/verify-email", verifyEmail);
router.post("/isEmailVerified", isEmailVerified);

router.post("/register", Register);
router.post("/login", Login);


router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

router.get("/facebook", facebookAuth);
router.get("/facebook/callback", facebookCallback);

export default router;
