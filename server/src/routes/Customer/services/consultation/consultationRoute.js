import express from 'express';
import {handleConsultationDetails} from '../../../../controllers/Customer/services/consultation/consultationController.js';
import { getConsultationDatas , getConsultationDataByDate } from '../../../../controllers/Customer/services/consultation/getConsultationDatas.js'


const router = express.Router()

router.post('/details'  ,handleConsultationDetails);
router.get('/getDatas',getConsultationDatas);
router.post('/by-date',getConsultationDataByDate);



export default router;