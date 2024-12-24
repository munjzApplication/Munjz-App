import express from "express";
import { createPricing, editPricing } from "../../../../controllers/Admin/Services/consultation/pricingController.js";
import { protectAdmin } from "../../../../middlewares/adminMiddleware.js";
const router = express.Router();

router.post("/pricing", protectAdmin,createPricing);
router.put("/pricing/:countryCode", protectAdmin,editPricing);

export default router;
