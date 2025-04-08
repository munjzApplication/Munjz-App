import express from 'express';
import { CreateCourtCase } from '../../../controllers/Admin/invoice/courtCase.js';
import { CreateNotaryCase } from '../../../controllers/Admin/invoice/notaryCase.js';
import { CreateTranslation } from '../../../controllers/Admin/invoice/translationCase.js';
import { getPaymentDetails , editPaymentDetails,deletePaymentDetails } from "../../../controllers/Admin/invoice/paymentDetails.js";

import upload from "../../../middlewares/fileUpload.js";
const router = express.Router();


router.post('/court-cases',upload.array("documents"), CreateCourtCase);
router.post('/notary-cases',upload.array("documents"), CreateNotaryCase);
router.post('/translations',upload.array("documents"), CreateTranslation);

router.get('/get-payment-details',getPaymentDetails);
router.put('/edit/:caseId',editPaymentDetails);
router.delete('/delete/:caseId',deletePaymentDetails);



export default router;
