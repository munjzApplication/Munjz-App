import express from "express";
import {
  saveNotaryServiceDetails,
  getAllNotaryCases
} from "../../../../controllers/Customer/services/notaryService/notaryServiceCaseController.js";
import { getServices } from "../../../../controllers/Customer/services/notaryService/notaryServicesController.js";
import { getCaseDetails } from "../../../../controllers/Customer/services/notaryService/getNotaryCaseController.js";
import upload from "../../../../middlewares/fileUpload.js";

const router = express.Router();

router.get("/get-service/:country", getServices);
router.post("/register",upload.array("documents"),saveNotaryServiceDetails);


router.get("/get-cases",getAllNotaryCases)
router.get("/get-case/details/:caseId",getCaseDetails)
export default router;
