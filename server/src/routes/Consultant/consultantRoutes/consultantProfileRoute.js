import express from "express";
import { getConsultantProfile , changePassword,updateProfilePicture } from "../../../controllers/Consultant/consultantProfileController.js";
import upload from "../../../middlewares/fileUpload.js";
const router = express.Router();

router.get("/getProfile", getConsultantProfile);
router.put("/change-password", changePassword);
router.put("/update-profile-picture",upload.single("profilePicture"),updateProfilePicture);




export default router;