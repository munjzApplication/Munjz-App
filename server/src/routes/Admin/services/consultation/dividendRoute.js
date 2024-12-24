import express from "express";
import { createDividend, editDividend } from "../../../../controllers/Admin/Services/consultation/dividendController.js";
import { protectAdmin } from "../../../../middlewares/adminMiddleware.js";
const router = express.Router();


router.post("/dividend",protectAdmin, createDividend);
router.put("/dividend/:countryCode",protectAdmin, editDividend);

export default router;
