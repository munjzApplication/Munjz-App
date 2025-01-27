import express from "express";
import { UploadRejectedDocuments } from "../../../controllers/Consultant/UploadRejectedDocuments.js";
import upload from "../../../middlewares/fileUpload.js";
const router = express.Router();

router.post(
  "/RejectedDocuments",
  upload.fields([
    { name: "frontsideId", maxCount: 1 },
    { name: "backsideId", maxCount: 1 },
    { name: "educationalCertificates", maxCount: 5 },
    { name: "experienceCertificates", maxCount: 5 },
  ]),
  UploadRejectedDocuments
);

export default router;

