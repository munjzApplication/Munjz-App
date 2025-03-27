import express from "express";
import { getCustomerServices } from "../../../../controllers/Admin/customer/getAllCustomerServices.js";

const router = express.Router();

router.post("/details",getCustomerServices);


export default router;
