import express from "express";
import { checkCountry } from "../../../controllers/Consultant/dividendController.js"

const router = express.Router();


router.post("/check-country",checkCountry);

export default router;
