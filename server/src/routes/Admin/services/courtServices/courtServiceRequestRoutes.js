import express from 'express';
import { requestDocument, getReqDocumentDetails, requestAdditionalPayment } from '../../../../controllers/Admin/Services/CourtService/courtRequestController.js';

const router = express.Router();


// Document Requests

router.post('/documents/request/:caseId', requestDocument);
router.patch('/get-req-doc/:caseId', getReqDocumentDetails);

// Payment Requests
router.post('/payments/request/:caseId', requestAdditionalPayment);


export default router;
