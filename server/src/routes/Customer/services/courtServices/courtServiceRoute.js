import express from "express";
import {
  saveCourtServiceDetails,
  getServices
} from "../../../../controllers/Customer/services/courtService/courtServiceController.js";

import upload from "../../../../middlewares/fileUpload.js";

const router = express.Router();

router.get("/get-service/:country", getServices);
router.post(
  "/submit-court-service/:customerID",
  upload.array("documents", 5),
  saveCourtServiceDetails
);

export default router;
