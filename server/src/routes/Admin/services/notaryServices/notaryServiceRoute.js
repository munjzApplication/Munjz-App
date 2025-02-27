import express from "express";
import {
  addNotaryService,
  getAllNotaryServices,
  updateNotaryService,
  deleteNotaryService,
} from "../../../../controllers/Admin/Services/NotaryService/notaryServiceController.js";

import {
  addNotaryServicePricing,
  getNotaryServicePricing,
  updateNotaryServicePricing,
  deleteNotaryServicePricing,
  getNotaryServicesByCountry
} from "../../../../controllers/Admin/Services/NotaryService/notaryServicePricingController.js";
import { getAllNotaryCases , getAllNotaryCasesWithID } from "../../../../controllers/Admin/Services/NotaryService/getNotarycaseController.js";
const router = express.Router();

// notary Service Routes
router.post("/add-service", addNotaryService);
router.get("/country/:country",getNotaryServicesByCountry)
router.get("/get-service", getAllNotaryServices);
router.put("/update-service/:id", updateNotaryService);
router.delete("/delete-service/:id", deleteNotaryService);


// notary Service Pricing Routes
router.post("/add-pricing", addNotaryServicePricing);
router.get("/get-pricing/:serviceId", getNotaryServicePricing);
router.put("/update-pricing/:serviceId", updateNotaryServicePricing);
router.delete("/delete-pricing/:id", deleteNotaryServicePricing);

router.get("/get-cases", getAllNotaryCases);
router.get("/customer-cases/:customerId",getAllNotaryCasesWithID)


export default router;
