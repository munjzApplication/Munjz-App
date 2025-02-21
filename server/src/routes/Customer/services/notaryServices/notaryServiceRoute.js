import express from "express";
import {
  saveNotaryServiceDetails,
  getServices
} from "../../../../controllers/Customer/services/notaryService/notaryServiceController.js";

import upload from "../../../../middlewares/fileUpload.js";

const router = express.Router();

router.get("/get-service/:country", getServices);
router.post("/register",upload.array("documents"),saveNotaryServiceDetails);

export default router;
