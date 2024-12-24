import express from 'express';
import { getAllPayments ,deletePendingPayment , editPendingPayment} from '../../../controllers/Admin/adminControllers/getAllPaymentsController.js';

const router = express.Router();


router.get('/getAllPayments',getAllPayments);
router.delete('/deletePendingPayment/:id',deletePendingPayment);
router.put('/editPendingPayment/:id',editPendingPayment);

export default router;
