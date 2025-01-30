import express from "express";
import { createDividend, editDividend,checkCountry } from "../../../../controllers/Admin/Services/Consultation/dividendController.js";
const router = express.Router();

router.post("/check-country",checkCountry);
router.post("/set-dividend", createDividend);
router.put("/dividend/:countryCode", editDividend);

export default router;
