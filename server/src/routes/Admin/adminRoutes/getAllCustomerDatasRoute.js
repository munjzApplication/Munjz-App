import express from 'express';
import { getAllCustomerData } from '../../../controllers/Admin/customer/getCustomerDatasController.js';

const router = express.Router();


router.get('/getAllCustomer',getAllCustomerData);


export default router;
