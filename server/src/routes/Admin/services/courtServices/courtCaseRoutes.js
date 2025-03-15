import express from "express";
import { editCourtCase } from "../../../../controllers/Admin/Services/CourtService/courtCaseController.js";
const router = express.Router();

router.put("/edit-case/:caseId",editCourtCase);


export default router;
