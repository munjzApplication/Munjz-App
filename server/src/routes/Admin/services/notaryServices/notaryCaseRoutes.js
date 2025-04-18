import express from "express";
import { editNotaryCase } from "../../../../controllers/Admin/Services/NotaryService/notaryCaseController.js";
import { adminSubmittedDoc } from '../../../../controllers/Admin/Services/NotaryService/notaryReqController.js';
import { getAllNotaryPayments } from "../../../../controllers/Admin/Services/NotaryService/getNotarycaseController.js"
import upload from '../../../../middlewares/fileUpload.js';
const router = express.Router();

router.put("/edit-case/:caseId",editNotaryCase);
router.post('/additional-docs/:caseId',upload.array('file',5),adminSubmittedDoc)
router.get("/payment-history/:caseId",getAllNotaryPayments)

export default router;
