import express from "express";
import {
  logoutProfile,
  getProfile,
  changePassword,
  deleteProfile,
  updateProfile,
  updateProfilePicture,
  getAllServices,
  profileSetup,
  countrySetup
} from "../../../controllers/Customer/customerController/profileController.js";

import upload from "../../../middlewares/fileUpload.js";

const router = express.Router();


router.post('/profile-setup', upload.single("profilePicture"), profileSetup);
router.post('/setup-country',countrySetup)
router.get("/get-profile", getProfile);
router.put("/update-profile", updateProfile);
router.delete("/delete-profile", deleteProfile);
router.put("/change-password", changePassword);
router.post("/logout", logoutProfile);
router.put("/update-profile-picture",upload.single("profilePicture"),updateProfilePicture);

router.get("/getservices", getAllServices);

export default router;
