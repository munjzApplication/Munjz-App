import express from 'express';
import { Login } from "../../../controllers/Admin/adminControllers/adminController.js";

const router = express.Router()

router.post('/login' , Login);



export default router;