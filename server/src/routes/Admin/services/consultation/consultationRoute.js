import express from "express";

import { getAllConsultationDatas } from "../../../../controllers/Admin/Services/Consultation/getConsultationData.js"

const router = express.Router();

router.get("/consultationDatas",getAllConsultationDatas)


export default router;
