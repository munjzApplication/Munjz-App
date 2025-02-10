import express from 'express';
import { requestWithdrawal } from '../../../controllers/Consultant/withdrawController.js';


const router = express.Router();

router.post('/request', requestWithdrawal);

export default router;
