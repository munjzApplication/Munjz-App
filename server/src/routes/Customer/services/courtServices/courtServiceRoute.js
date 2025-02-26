import express from "express";
import {
  saveCourtServiceDetails,
  getAllCourtCases
} from "../../../../controllers/Customer/services/courtService/courtServiceCaseController.js";
import { getServices } from "../../../../controllers/Customer/services/courtService/courtServiceController.js";
import upload from "../../../../middlewares/fileUpload.js";

const router = express.Router();

router.get("/get-service/:country", getServices);
router.post("/submit-court-service",upload.array("documents"),saveCourtServiceDetails);
router.get("/get-cases",getAllCourtCases)

export default router;
