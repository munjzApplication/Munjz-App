import express from 'express';
import { requestDocuments ,requestAdditionalPayment } from '../../../../controllers/Admin/Services/Translation/translationReqController.js';
import { getAllTranslations , getTranslationCaseById ,getCaseDocs} from "../../../../controllers/Admin/Services/Translation/getTranslationController.js";

const router = express.Router();



router.post('/documents/request/:caseId',requestDocuments);
router.post('/payments/request/:caseId',requestAdditionalPayment);


router.get("/get-cases", getAllTranslations);
router.get("/customer-cases/:customerId",getTranslationCaseById)
router.get("/get-docs/:caseId",getCaseDocs)



export default router;
