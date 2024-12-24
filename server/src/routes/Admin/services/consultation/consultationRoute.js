import express from 'express';
import {handleConsultationDetails} from '../../../../controllers/Admin/Services/Consultation/consultationController.js';
import {protectAdmin} from '../../../../middlewares/adminMiddleware.js';


const router = express.Router()

router.post('/calculate-share' , protectAdmin ,handleConsultationDetails);



export default router;