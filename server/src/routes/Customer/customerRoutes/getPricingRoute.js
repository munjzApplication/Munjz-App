import express from 'express';
import { getPricing } from '../../../controllers/Customer/customerController/getPricingController.js';

const router = express.Router();

router.post('/getPricing',getPricing);


export default router;