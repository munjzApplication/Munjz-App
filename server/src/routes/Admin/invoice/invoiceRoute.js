import express from 'express';
import { CreateCase } from '../../../controllers/Admin/invoice/invoiceCreateController.js';
const router = express.Router();


router.post('/create-case', CreateCase);


export default router;
