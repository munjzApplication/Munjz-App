import express from "express";
import { getBankDetails} from "../../../controllers/Consultant/getDatasController.js";

const router = express.Router();


router.get("/get-bankDetails/:consultantId", getBankDetails);

export default router;
