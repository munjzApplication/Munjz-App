import express from 'express';
import { getAdminEarnings , getAdminEarningsFilter} from "../../../controllers/Admin/adminControllers/getAdminEarnings.js";
const router = express.Router();

router.get('/admin-earnings',getAdminEarnings);
router.get('/adminearnings-filter-by-service/:serviceName',getAdminEarningsFilter);

export default router;