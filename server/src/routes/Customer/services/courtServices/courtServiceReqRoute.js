import express from "express";
import {
  uploadAdminRequestedDocument,
  submitAdditionalPayment,
  getPaymentsByCaseId,
  getDocummentByCaseId
} from "../../../../controllers/Customer/services/courtService/courtServiceReqController.js";
import upload from "../../../../middlewares/fileUpload.js";
import { uploadCustomerAdditionalDocument } from "../../../../controllers/Customer/services/courtService/courtServiceReqController.js";

const router = express.Router();

router.post("/documents/upload/:caseId", upload.array("documents", 5),uploadAdminRequestedDocument);
router.get("/get-documents/:caseId", getDocummentByCaseId);
router.post("/additional-docs/:caseId",upload.array("documents"),uploadCustomerAdditionalDocument);

router.post("/payments/submit/:caseId", submitAdditionalPayment);
router.get("/get-payment/:caseId", getPaymentsByCaseId);

export default router;
