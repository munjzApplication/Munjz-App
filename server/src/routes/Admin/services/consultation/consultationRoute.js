import express from "express";

import { getAllConsultationDatas,getConsultationDataById ,getConsultationReviews} from "../../../../controllers/Admin/Services/Consultation/getConsultationData.js"

const router = express.Router();

router.get("/consultationDatas",getAllConsultationDatas)
router.get("/consultationDatas/:ConsultantId",getConsultationDataById)
router.get("/consultationReview/:ConsultantId",getConsultationReviews)


export default router;
