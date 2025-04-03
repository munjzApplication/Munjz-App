import express from "express";
import { editTranslation } from "../../../../controllers/Admin/Services/Translation/translationController.js";
import { adminSubmittedDoc } from "../../../../controllers/Admin/Services/Translation/translationReqController.js";
import { getAllTranslationPayments } from "../../../../controllers/Admin/Services/Translation/getTranslationController.js"
import upload from '../../../../middlewares/fileUpload.js';
const router = express.Router();

router.put("/edit-case/:caseId",editTranslation);
router.post('/additional-docs/:caseId',upload.array('file',5),adminSubmittedDoc)
router.get("/payment-history/:caseId",getAllTranslationPayments)

export default router;
