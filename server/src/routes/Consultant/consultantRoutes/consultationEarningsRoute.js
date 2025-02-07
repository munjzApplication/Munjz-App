import express from "express";
import { convertEarningsToAED } from "../../../controllers/Consultant/ConsultantEarnings.js"

const router = express.Router();


router.post('/conversion', convertEarningsToAED);


export default router;
