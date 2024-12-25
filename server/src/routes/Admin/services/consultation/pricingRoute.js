import express from "express";
import { createPricing, editPricing } from "../../../../controllers/Admin/Services/Consultation/pricingController.js";
const router = express.Router();

router.post("/pricing",createPricing);
router.put("/pricing/:countryCode",editPricing);

export default router;
