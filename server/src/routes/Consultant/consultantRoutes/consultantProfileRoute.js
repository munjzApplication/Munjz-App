import express from "express";
import { getConsultantProfile } from "../../../controllers/Consultant/consultantProfileController.js";

const router = express.Router();

router.get("/getProfile", getConsultantProfile);

export default router;