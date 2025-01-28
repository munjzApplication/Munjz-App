import express from 'express';
import { getConsultantLists } from '../../../controllers/Customer/consultantController/getConsultantLists.js';

const router = express.Router();

router.get('/getDatas',getConsultantLists);


export default router;