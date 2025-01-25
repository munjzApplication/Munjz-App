import express from "express";
import { getBankDetails , getDocuments, getPersonalDetails} from "../../../controllers/Consultant/getDatasController.js";
import { validateConsultantId } from "../../../middlewares/validateId.js";
const router = express.Router();


router.get("/get-bankDetails/:consultantId",validateConsultantId, getBankDetails);
router.get("/get-documents/:consultantId",validateConsultantId, getDocuments);
router.get("/get-personalDetails/:consultantId",validateConsultantId, getPersonalDetails);

export default router;
