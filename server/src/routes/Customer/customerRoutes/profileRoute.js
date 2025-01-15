import express from "express";
import {
  logoutProfile,
  getProfile,
  forgotPassword,
  changePassword,
  deleteProfile,
  updateProfile,
  updateProfilePicture,
  getAllServices,
  profileSetup
} from "../../../controllers/Customer/customerController/profileController.js";

import upload from "../../../middlewares/fileUpload.js";

const router = express.Router();


router.post('/profile-setup', upload.single("profilePicture"), profileSetup);

router.get("/get-profile/:id", getProfile);
router.put("/update-profile/:id", updateProfile);
router.delete("/delete-profile/:id", deleteProfile);
router.put("/change-password/:id", changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/logout", logoutProfile);
router.put("/update-profile-picture/:id",upload.single("profilePicture"),updateProfilePicture);

router.get("/getservices/:id", getAllServices);

export default router;
