import express from "express";
import {
  saveCourtServiceDetails,
  getAllCourtCases
} from "../../../../controllers/Customer/services/courtService/courtServiceCaseController.js";
import { getServices } from "../../../../controllers/Customer/services/courtService/courtServiceController.js";
import { uploadCustomerAdditionalDocument } from "../../../../controllers/Customer/services/courtService/courtServiceReqController.js";
import { getCaseDetails } from "../../../../controllers/Customer/services/courtService/getCourtCaseController.js";
import upload from "../../../../middlewares/fileUpload.js";

const router = express.Router();

router.get("/get-service/:country", getServices);
router.post("/register",upload.array("documents"),saveCourtServiceDetails);
router.get("/get-cases",getAllCourtCases)
router.post("/additional-docs/:caseId",upload.array("documents"),uploadCustomerAdditionalDocument);
router.get("/get-case/details/:caseId",getCaseDetails)

export default router;
