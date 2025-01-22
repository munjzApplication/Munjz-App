import express from "express";
import { getConsultantProfile , changePassword,updateProfilePicture,forgotPassword } from "../../../controllers/Consultant/consultantProfileController.js";
import upload from "../../../middlewares/fileUpload.js";
const router = express.Router();

router.get("/getProfile", getConsultantProfile);
router.put("/change-password", changePassword);
router.put("/update-profile-picture",upload.single("profilePicture"),updateProfilePicture);
router.post("/forgot-password",forgotPassword);


export default router;