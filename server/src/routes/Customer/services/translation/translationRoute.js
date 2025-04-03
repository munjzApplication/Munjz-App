import express from "express";
import { submitTranslationRequest ,getAllTranslation } from "../../../../controllers/Customer/services/translation/translationController.js";
import {
  uploadAdminReqDocuments,
  submitAdditionalPayment,
  uploadCustomerAdditionalDocument
} from "../../../../controllers/Customer/services/translation/translationReqControllers.js";
import { getCaseDetails } from "../../../../controllers/Customer/services/translation/getTranslationController.js"
import upload from "../../../../middlewares/fileUpload.js";

const router = express.Router();

router.post("/submit-translation",upload.array("documents"),submitTranslationRequest);
router.get("/get",getAllTranslation);
router.get("/get-case/details/:caseId",getCaseDetails)
router.post("/documents/upload/:caseId",upload.array("documents", 5),uploadAdminReqDocuments);
router.post("/additional-docs/:caseId",upload.array("documents"),uploadCustomerAdditionalDocument);
router.post("/payments/submit/:caseId", submitAdditionalPayment);

export default router;
