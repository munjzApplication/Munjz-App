import express from "express";
import { getConsultantProfile ,addPhoneNumber, changePassword,updateProfilePicture ,deleteProfile } from "../../../controllers/Consultant/consultantProfileController.js";
import upload from "../../../middlewares/fileUpload.js";
const router = express.Router();

router.post("/add-phone", addPhoneNumber);
router.get("/getProfile", getConsultantProfile);
router.put("/change-password", changePassword);
router.put("/update-profile-picture",upload.single("profilePicture"),updateProfilePicture);
router.delete("/delete-profile",deleteProfile);




export default router;