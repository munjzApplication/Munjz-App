import express from 'express';
import { getCustomerPayments , getCustomerDocuments } from '../../../controllers/Customer/invoice/customerInvoiceController.js';
import { getCustomerInvoices } from "../../../controllers/Customer/invoice/getInvoices.js";

const router = express.Router();

router.get('/payments/all',getCustomerPayments);
router.get('/documents/all',getCustomerDocuments);

router.get('/get-payments',getCustomerInvoices)

export default router;