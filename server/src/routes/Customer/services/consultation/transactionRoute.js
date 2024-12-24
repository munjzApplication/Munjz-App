import express from 'express';
import {createTransaction} from '../../../../controllers/Customer/services/consultation/transactionController.js';
const router = express.Router();

router.post('/transaction-details' , createTransaction);

export default router;