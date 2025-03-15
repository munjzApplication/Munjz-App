import express from "express";
import { editTranslation } from "../../../../controllers/Admin/Services/Translation/translationController.js";
const router = express.Router();

router.put("/edit-case/:caseId",editTranslation);


export default router;
