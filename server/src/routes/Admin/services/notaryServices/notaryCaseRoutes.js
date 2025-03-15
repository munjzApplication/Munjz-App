import express from "express";
import { editNotaryCase } from "../../../../controllers/Admin/Services/NotaryService/notaryCaseController.js";
const router = express.Router();

router.put("/edit-case/:caseId",editNotaryCase);


export default router;
