import express from 'express';
import { updateWithdrawalStatus } from '../../../controllers/Admin/Services/consultation/withdrawRequestController.js';
import { protectAdmin } from '../../../middlewares/adminMiddleware.js';
const router = express.Router();


router.patch('/withdrawals/:id/status',protectAdmin, updateWithdrawalStatus);

export default router;
