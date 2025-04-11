import express from "express";

import { getAllConsultationDatas,getConsultationDataById } from "../../../../controllers/Admin/Services/Consultation/getConsultationData.js"

const router = express.Router();

router.get("/consultationDatas",getAllConsultationDatas)
router.get("/consultationDatas/:ConsultantId",getConsultationDataById)


export default router;
