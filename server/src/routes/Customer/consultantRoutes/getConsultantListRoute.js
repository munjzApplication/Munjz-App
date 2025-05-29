import express from 'express';
import { getConsultantLists ,getTopRatedConsultants} from '../../../controllers/Customer/consultantController/getConsultantLists.js';

const router = express.Router();

router.get('/getDatas',getConsultantLists);
router.get('/top-rated', getTopRatedConsultants);


export default router;