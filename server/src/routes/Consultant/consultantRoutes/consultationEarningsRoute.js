import express from "express";
import { convertEarningsToLocalCurrency } from "../../../controllers/Consultant/ConsultantEarnings.js"

const router = express.Router();


router.post('/conversion', convertEarningsToLocalCurrency);


export default router;
