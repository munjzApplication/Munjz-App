import express from 'express';
import { getCustomerPayments , getCustomerDocuments } from '../../../controllers/Customer/invoice/customerInvoiceController.js';

const router = express.Router();

router.get('/payments/all',getCustomerPayments);
router.get('/documents/all',getCustomerDocuments);

export default router;