import express from 'express';
import { getAllNews, createNews , updateNews , deleteNews } from "../../../controllers/Admin/adminControllers/newsController.js";
import { protectAdmin } from "../../../middlewares/adminMiddleware.js";
const router = express.Router();

router.get('/getAllNews', protectAdmin,getAllNews);
router.post('/createNews', protectAdmin,createNews);
router.put('/updateNews/:id',protectAdmin, updateNews);
router.delete('/deleteNews/:id',protectAdmin, deleteNews);

export default router;