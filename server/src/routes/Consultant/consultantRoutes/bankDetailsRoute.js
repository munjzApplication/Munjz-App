import express from 'express';
import {saveBankDetails} from '../../../controllers/Consultant/bankDetailsController.js';

const router = express.Router();

router.post('/bank-details',saveBankDetails);



export default router;