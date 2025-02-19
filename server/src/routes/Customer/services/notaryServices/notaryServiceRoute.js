import express from "express";
import {
  saveNotaryServiceDetails,
  getServices
} from "../../../../controllers/Customer/services/notaryService/notaryServiceController.js";

import upload from "../../../../middlewares/fileUpload.js";

const router = express.Router();

router.get("/get-service/:country", getServices);
router.post("/submit-notary-service/:customerId",upload.array("documents", 5),saveNotaryServiceDetails);

export default router;
