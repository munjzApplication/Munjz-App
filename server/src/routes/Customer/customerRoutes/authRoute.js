import express from 'express';
import { Register  , Login , Profile, googleAuth ,googleCallback,verifyEmail} from '../../../controllers/Customer/customerController/authController.js'
import { authenticateUser } from '../../../middlewares/customerMiddleware.js';


const router = express.Router()

router.post('/register', Register);
router.post('/login',Login)
router.get('/verify-email', verifyEmail);

router.get("/google", googleAuth);
router.get("/google/callback",googleCallback);
router.get("/profile",authenticateUser,Profile)


export default router;