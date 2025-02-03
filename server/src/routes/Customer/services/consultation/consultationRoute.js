import express from 'express';
import {handleConsultationDetails} from '../../../../controllers/Customer/consultationController/consultationController.js';


const router = express.Router()

router.post('/details'  ,handleConsultationDetails);



export default router;