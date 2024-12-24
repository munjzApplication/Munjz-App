import express from 'express';
import { requestDocument, reviewDocument, requestAdditionalPayment,adminSubmittedDoc } from '../../../../controllers/Admin/Services/CourtService/courtRequestController.js';
import upload from '../../../../middlewares/fileUpload.js';
const router = express.Router();


// Document Requests
router.post('/admin-submittedDocument/:caseId',upload.array('file',5),adminSubmittedDoc)
router.post('/documents/request/:caseId', requestDocument);
router.patch('/documents/review/:documentId', reviewDocument);

// Payment Requests
router.post('/payments/request/:caseId', requestAdditionalPayment);


export default router;
