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
  deleteNotaryServicePricing
} from "../../../../controllers/Admin/Services/NotaryService/notaryServicePricingController.js";

const router = express.Router();

// notary Service Routes
router.post("/notary-service", addNotaryService);
router.get("/notary-service", getAllNotaryServices);
router.put("/notary-service/:id", updateNotaryService);
router.delete("/notary-service/:id", deleteNotaryService);


// notary Service Pricing Routes
router.post("/notary-service-pricing", addNotaryServicePricing);
router.get("/notary-service-pricing/:serviceId", getNotaryServicePricing);
router.put("/notary-service-pricing/:id", updateNotaryServicePricing);
router.delete("/notary-service-pricing/:id", deleteNotaryServicePricing);


export default router;
