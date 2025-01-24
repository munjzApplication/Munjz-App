import express from 'express';
import { getAllPayments ,deletePendingPayment , editPendingPayment} from '../../../controllers/Admin/adminControllers/getAllPaymentsController.js';
import { getAllConsultantData ,getConsultantDocs ,getConsultantBankDetails ,getConsultantData} from '../../../controllers/Admin/consultant/getAllConsultantData.js';
import { validateConsultantId } from '../../../middlewares/validateId.js';
const router = express.Router();


router.get('/getAllPayments',getAllPayments);
router.delete('/deletePendingPayment/:consultantId',validateConsultantId,deletePendingPayment);
router.put('/editPendingPayment/:consultantId',validateConsultantId,editPendingPayment);

router.get('/getAllConsultantData',getAllConsultantData);
router.get('/getDocs/:consultantId',validateConsultantId,getConsultantDocs);
router.get("/getBankDetails/:consultantId",validateConsultantId,getConsultantBankDetails);
router.get("/getConsultantData/:consultantId",validateConsultantId,getConsultantData);

export default router;
