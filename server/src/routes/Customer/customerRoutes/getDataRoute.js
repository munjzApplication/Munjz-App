import express from 'express';
import { getTransactionDetails ,getWalletDetails} from '../../../controllers/Customer/customerController/getDatasController.js';
import { getCustomerTransactions} from '../../../controllers/Customer/customerController/transactionController.js';
const router = express.Router();

router.get('/transaction-details',getCustomerTransactions);
router.get('/wallet-details',getWalletDetails);



export default router;