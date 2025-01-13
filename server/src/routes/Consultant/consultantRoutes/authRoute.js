import express from 'express';
import { Register  , Login , googleAuth ,googleCallback,verifyEmailAndCompleteRegistration,facebookAuth,facebookCallback} from '../../../controllers/Consultant/authController.js'
import { protect } from '../../../middlewares/authMiddleware.js';


const router = express.Router()


router.post('/register', Register);
router.post('/login',Login)
router.get('/verify-email', verifyEmailAndCompleteRegistration);

router.get("/google", googleAuth);
router.get("/google/callback",googleCallback);
router.get("/facebook", facebookAuth);
router.get("/facebook/callback", facebookCallback);



export default router;