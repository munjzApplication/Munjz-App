import express from "express";
import { editCourtCase } from "../../../../controllers/Admin/Services/CourtService/courtCaseController.js";
import { adminSubmittedDoc } from "../../../../controllers/Admin/Services/CourtService/courtRequestController.js";
const router = express.Router();

router.put("/edit-case/:caseId",editCourtCase);
router.post('/additional-docs/:caseId',upload.array('file',5),adminSubmittedDoc)


export default router;
