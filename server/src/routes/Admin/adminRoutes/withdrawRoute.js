import express from 'express';
import { updateWithdrawalStatus } from "../../../controllers/Admin/Services/Consultation/withdrawRequestController.js";

const router = express.Router();


router.put('/update-status/:requestId', updateWithdrawalStatus);

export default router;
