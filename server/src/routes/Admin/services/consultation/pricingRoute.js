import express from "express";
import { createPricing, editPricing ,checkCountry} from "../../../../controllers/Admin/Services/Consultation/pricingController.js";
const router = express.Router();

router.post("/check-country",checkCountry);
router.post("/set-manual-price",createPricing);
router.put("/pricing/:countryCode",editPricing);

export default router;
