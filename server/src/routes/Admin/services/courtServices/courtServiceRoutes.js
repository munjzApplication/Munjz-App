import express from "express";
import {
  addCourtService,
  getAllCourtServices,
  updateCourtService,
  deleteCourtService,
  
  
} from "../../../../controllers/Admin/Services/CourtService/courtServiceController.js";

import {
  getServicesByCountry,
  addCourtServicePricing,
  getCourtServicePricing,
  updateCourtServicePricing,
  deleteCourtServicePricing
} from "../../../../controllers/Admin/Services/CourtService/courtServicePricingController.js";
import { getAllCourtCases ,getAllCourtCasesWithID } from "../../../../controllers/Admin/Services/CourtService/getCourtcaseController.js";
const router = express.Router();

// Court Service Routes
router.post("/add-service", addCourtService);
router.get("/get-service", getAllCourtServices);
router.put("/updated-service/:id", updateCourtService);
router.delete("/deleted-service/:id", deleteCourtService);


// Court Service Pricing Routes
router.get('/get-services-by-country/:country',getServicesByCountry);
router.post("/add-service-pricing", addCourtServicePricing);
router.get("/get-service-pricing/:serviceId", getCourtServicePricing);
router.put("/updated-service-pricing/:serviceId", updateCourtServicePricing);
router.delete("/delete-service-pricing/:id", deleteCourtServicePricing);

router.get("/get-cases", getAllCourtCases);
router.get("/customer-cases/:customerId",getAllCourtCasesWithID)


export default router;
