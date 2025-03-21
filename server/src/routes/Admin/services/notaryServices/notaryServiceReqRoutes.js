import express from 'express';
import { requestDocument, reviewDocument, requestAdditionalPayment } from '../../../../controllers/Admin/Services/NotaryService/notaryReqController.js';

const router = express.Router();


// Document Requests
router.post('/documents/request/:caseId', requestDocument);
router.patch('/documents/review/:documentId', reviewDocument);

// Payment Requests
router.post('/payments/request/:caseId', requestAdditionalPayment);


export default router;
