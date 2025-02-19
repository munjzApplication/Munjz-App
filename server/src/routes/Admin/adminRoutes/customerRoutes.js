import express from 'express';
import { blockUnblockCustomer } from '../../../controllers/Admin/customer/blockUnblockCustomerController.js';
import { getAllCustomerData } from '../../../controllers/Admin/customer/getCustomerDatasController.js';
import { getWalletDetails } from '../../../controllers/Admin/customer/walletCustomerController.js';

const router = express.Router()

router.post('/blockUnblock/:customerId' ,blockUnblockCustomer);
router.get('/getAllCustomer',getAllCustomerData);
router.post('/getwalletDetails',getWalletDetails);



export default router;