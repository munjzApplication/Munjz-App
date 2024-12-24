import express from "express";
import {
  addCourtService,
  getAllCourtServices,
  updateCourtService,
  deleteCourtService,
  getServicesByCountry,
  
} from "../../../../controllers/Admin/Services/CourtService/courtServiceController.js";

import {
  addCourtServicePricing,
  getCourtServicePricing,
  updateCourtServicePricing,
  deleteCourtServicePricing
} from "../../../../controllers/Admin/Services/CourtService/courtServicePricingController.js";

const router = express.Router();

// Court Service Routes
router.post("/court-service", addCourtService);
router.get("/court-service", getAllCourtServices);
router.put("/court-service/:id", updateCourtService);
router.delete("/court-service/:id", deleteCourtService);
router.get('/court-services-by-country/:country',getServicesByCountry);


// Court Service Pricing Routes
router.post("/court-service-pricing", addCourtServicePricing);
router.get("/court-service-pricing/:serviceId", getCourtServicePricing);
router.put("/court-service-pricing/:id", updateCourtServicePricing);
router.delete("/court-service-pricing/:id", deleteCourtServicePricing);

export default router;
