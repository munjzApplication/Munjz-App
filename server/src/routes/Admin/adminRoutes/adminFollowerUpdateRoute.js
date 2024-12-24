import express from 'express';
import { adminFollowerUpdate } from '../../../controllers/Admin/adminControllers/adminFollowerUpdate.js';


const router = express.Router()

router.post('/follower-update' , adminFollowerUpdate);



export default router;