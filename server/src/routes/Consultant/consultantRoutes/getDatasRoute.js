import express from "express";
import { getBankDetails , getIdProof, getPersonalDetails} from "../../../controllers/Consultant/getDatasController.js";
import { validateConsultantId } from "../../../middlewares/validateId.js";
const router = express.Router();


router.get("/get-bankDetails/:consultantId",validateConsultantId, getBankDetails);
router.get("/get-idProof/:consultantId",validateConsultantId, getIdProof);
router.get("/get-personalDetails/:consultantId",validateConsultantId, getPersonalDetails);

export default router;
