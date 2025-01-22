import express from 'express';
import { getAllPayments ,deletePendingPayment , editPendingPayment} from '../../../controllers/Admin/adminControllers/getAllPaymentsController.js';
// import { getAllConsultantData } from '../../../controllers/Admin/adminControllers/getAllConsultantData.js';
const router = express.Router();


router.get('/getAllPayments',getAllPayments);
router.delete('/deletePendingPayment/:id',deletePendingPayment);
router.put('/editPendingPayment/:id',editPendingPayment);

// router.get('/getAllConsultantData',getAllConsultantData);

export default router;
