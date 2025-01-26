import express from 'express';
import { blockUnblockCustomer } from '../../../controllers/Admin/customer/blockUnblockCustomerController.js';

const router = express.Router()

router.post('/blockUnblock/:customerId' ,blockUnblockCustomer);



export default router;