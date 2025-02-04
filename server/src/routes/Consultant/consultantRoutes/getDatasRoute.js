import express from "express";
import { getBankDetails , getDocuments, getPersonalDetails , getDocStatus } from "../../../controllers/Consultant/getDatasController.js";
import { getConsultationDetails } from "../../../controllers/Consultant/getConsultationDatas.js"
import { getConsultantEarnings } from "../../../controllers/Consultant/getConsultantEarnings.js"
const router = express.Router();


router.get("/get-bankDetails", getBankDetails);
router.get("/get-documents", getDocuments);
router.get("/get-personalDetails", getPersonalDetails);
router.get("/status-check", getDocStatus);
router.get("/consultationDatas",getConsultationDetails)
router.get("/earnings",getConsultantEarnings)


export default router;
