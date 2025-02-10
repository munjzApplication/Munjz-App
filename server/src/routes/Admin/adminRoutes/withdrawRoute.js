import express from 'express';
import { updateWithdrawalStatus ,getWithdrawalDatas} from "../../../controllers/Admin/consultant/withdrawController.js";

const router = express.Router();

router.get('/withdrawal-requests',getWithdrawalDatas)
router.put('/update-status/:requestId', updateWithdrawalStatus);

export default router;
