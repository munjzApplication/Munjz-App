import express from 'express';
import { requestWithdrawal,getWithdrawalDatas } from '../../../controllers/Consultant/withdrawController.js';


const router = express.Router();
router.get('/get-withdrawals',getWithdrawalDatas)
router.post('/request', requestWithdrawal);

export default router;
