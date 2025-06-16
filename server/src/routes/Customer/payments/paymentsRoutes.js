import express from "express";
import { createPaymentIntent ,confirmTestPaymentIntent } from "../../../controllers/Customer/payments/paymentIntent.js";


const router = express.Router();

router.post("/create-intent", createPaymentIntent);
router.post("/confirm-test-intent", confirmTestPaymentIntent)


export default router;