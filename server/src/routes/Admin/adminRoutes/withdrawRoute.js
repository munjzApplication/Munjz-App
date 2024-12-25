import express from 'express';
import { updateWithdrawalStatus } from "../../../controllers/Admin/Services/Consultation/withdrawRequestController.js";

const router = express.Router();


router.patch('/withdrawals/:id/status', updateWithdrawalStatus);

export default router;
