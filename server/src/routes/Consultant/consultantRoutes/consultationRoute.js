import express from "express";
import { getConsultationDetails ,getConsultationDataByDate } from "../../../controllers/Consultant/getConsultationDatas.js"

const router = express.Router();



router.get("/getDatas",getConsultationDetails);
router.post('/by-date',getConsultationDataByDate);


export default router;
