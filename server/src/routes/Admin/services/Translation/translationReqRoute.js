import express from 'express';
import { requestDocuments ,requestAdditionalPayment } from '../../../../controllers/Admin/Services/Translation/translationReqController.js';
import { adminSubmittedDoc } from "../../../../controllers/Admin/Services/Translation/adminUploadController.js";
import { getAllTranslations , getTranslationCaseById ,getCaseDocs} from "../../../../controllers/Admin/Services/Translation/getTranslationController.js";
import upload from '../../../../middlewares/fileUpload.js';
import { protectAdmin } from '../../../../middlewares/adminMiddleware.js';
const router = express.Router();



router.post('/documents/request/:caseId', protectAdmin,requestDocuments);
router.post('/payments/request/:caseId', protectAdmin,requestAdditionalPayment);

// adminUploadDocument
router.post('/admin-submittedDocument/:caseId',upload.array('file',5),protectAdmin,adminSubmittedDoc)

router.get("/get-cases", getAllTranslations);
router.get("/customer-cases/:caseId",getTranslationCaseById)
router.get("/get-docs/:caseId",getCaseDocs)



export default router;
