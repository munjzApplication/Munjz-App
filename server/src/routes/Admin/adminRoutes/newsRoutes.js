import express from 'express';
import { getAllNews, createNews , updateNews , deleteNews } from "../../../controllers/Admin/adminControllers/newsController.js";
import { protectAdmin } from "../../../middlewares/adminMiddleware.js";
import upload from '../../../middlewares/fileUpload.js';
const router = express.Router();

router.get('/news', protectAdmin,getAllNews);
router.post('/create', protectAdmin, upload.array('files'), createNews); 
router.put('/update/:id', protectAdmin, upload.array('files'), updateNews);
router.delete('/delete/:id',protectAdmin, deleteNews);

export default router;