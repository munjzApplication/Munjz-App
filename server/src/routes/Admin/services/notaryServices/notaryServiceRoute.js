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

const router = express.Router();

// notary Service Routes
router.post("/add-service", addNotaryService);
router.get("/country/:country",getNotaryServicesByCountry)
router.get("/get-service", getAllNotaryServices);
router.put("/update-service/:id", updateNotaryService);
router.delete("/delete-service/:id", deleteNotaryService);


// notary Service Pricing Routes
router.post("/service-pricing", addNotaryServicePricing);
router.get("/get-pricing/:serviceId", getNotaryServicePricing);
router.put("/update-pricing/:id", updateNotaryServicePricing);
router.delete("/delete-pricing/:id", deleteNotaryServicePricing);


export default router;
