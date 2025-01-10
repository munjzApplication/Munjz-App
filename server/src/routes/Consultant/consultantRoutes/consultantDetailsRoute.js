import express from "express";
import { handleConsultantAction } from "../../../controllers/Consultant/consultatntAction.js";
import upload from "../../../middlewares/fileUpload.js";
const router = express.Router();

router.post(
  "/consultant/action",
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "frontsideId", maxCount: 1 },
    { name: "backsideId", maxCount: 1 },
    { name: "educationalCertificates", maxCount: 1 },
    { name: "experienceCertificates", maxCount: 1 },
  ]),
  handleConsultantAction
);

export default router;

