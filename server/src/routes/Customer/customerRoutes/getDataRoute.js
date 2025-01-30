import express from 'express';
import { getTransactionDetails ,getWalletDetails} from '../../../controllers/Customer/customerController/getDatasController.js';

const router = express.Router();

router.get('/transaction-details',getTransactionDetails);
router.get('/wallet-details',getWalletDetails)


export default router;