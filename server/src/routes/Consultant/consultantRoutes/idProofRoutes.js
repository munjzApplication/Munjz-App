import express from 'express';
import { uploadIDProof } from '../../../controllers/Consultant/idProofController.js';
import upload from '../../../middlewares/fileUpload.js';


const router = express.Router();

// Route for uploading ID proof
router.post('/idproof', upload.fields([
  { name: 'frontsideId', maxCount: 1 },
  { name: 'backsideId', maxCount: 1 },
  { name: 'educationalCertificates', maxCount: 1 },
  { name: 'experienceCertificates', maxCount: 1 },
]), uploadIDProof);

export default router;
