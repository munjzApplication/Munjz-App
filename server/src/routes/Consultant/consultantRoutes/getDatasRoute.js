import express from "express";
import { getBankDetails , getIdProof, getPersonalDetails} from "../../../controllers/Consultant/getDatasController.js";

const router = express.Router();


router.get("/get-bankDetails/:consultantId", getBankDetails);
router.get("/get-idProof/:consultantId", getIdProof);
router.get("/get-personalDetails/:consultantId", getPersonalDetails);

export default router;
