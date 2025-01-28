import express from "express";
import { getBankDetails , getDocuments, getPersonalDetails , getDocStatus} from "../../../controllers/Consultant/getDatasController.js";
import { validateConsultantId } from "../../../middlewares/validateId.js";
const router = express.Router();


router.get("/get-bankDetails", getBankDetails);
router.get("/get-documents", getDocuments);
router.get("/get-personalDetails", getPersonalDetails);
router.get("/status-check", getDocStatus);

export default router;
