import express from 'express';
import { requestWithdrawal,getWithdrawalDatas } from '../../../controllers/Consultant/withdrawController.js';


const router = express.Router();
router.get('/get-withdrawls',getWithdrawalDatas)
router.post('/request', requestWithdrawal);

export default router;
