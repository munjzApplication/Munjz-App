import express from 'express';
import { getAdminEarnings } from "../../../controllers/Admin/adminControllers/getAdminEarnings.js";
const router = express.Router();

router.get('/admin-earnings',getAdminEarnings);

export default router;