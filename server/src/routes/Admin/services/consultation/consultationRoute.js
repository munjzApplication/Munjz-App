import express from 'express';
import {handleConsultationDetails} from '../../../../controllers/Admin/Services/Consultation/consultationController.js';


const router = express.Router()

router.post('/calculate-share'  ,handleConsultationDetails);



export default router;