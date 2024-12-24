import express from 'express';
import { getCustomerPending } from '../../../controllers/Customer/customerController/customerPendingsController.js';

const router = express.Router();

router.get('/notification/all',getCustomerPending);


export default router;