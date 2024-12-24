import express from 'express';
import { savePersonalDetails } from '../../../controllers/Consultant/personalDetailsController.js';
import upload from '../../../middlewares/fileUpload.js';


const router = express.Router();

router.post('/update-details', upload.single('profilePicture'), savePersonalDetails);




export default router;