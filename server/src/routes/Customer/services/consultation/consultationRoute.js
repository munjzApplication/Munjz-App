import express from 'express';
import {handleConsultationDetails} from '../../../../controllers/Customer/services/consultation/consultationController.js';
import { getConsultationDatas } from '../../../../controllers/Customer/services/consultation/getConsultationDatas.js'


const router = express.Router()

router.post('/details'  ,handleConsultationDetails);
router.get('/getDatas',getConsultationDatas);



export default router;