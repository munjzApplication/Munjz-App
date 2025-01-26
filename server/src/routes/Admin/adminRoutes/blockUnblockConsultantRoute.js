import express from 'express';
import { protectAdmin } from '../../../middlewares/adminMiddleware.js';
import { blockUnblockConsultant } from '../../../controllers/Admin/consultant/blockUnblockConsultantController.js';

const router = express.Router()

router.post('/blockUnblock/:consultantId' ,blockUnblockConsultant);



export default router;