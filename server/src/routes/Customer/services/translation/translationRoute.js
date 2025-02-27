import express from "express";
import { submitTranslationRequest } from "../../../../controllers/Customer/services/translation/translationController.js";
import {
  uploadAdminReqDocuments,
  submitAdditionalPayment
} from "../../../../controllers/Customer/services/translation/translationReqControllers.js";

import upload from "../../../../middlewares/fileUpload.js";

const router = express.Router();

router.post(
  "/submit-translation",
  upload.array("documents"),
  submitTranslationRequest
);
router.post(
  "/documents/upload/:caseId",
  upload.array("documents", 5),
  uploadAdminReqDocuments
);
router.post("/payments/submit/:caseId", submitAdditionalPayment);

export default router;
