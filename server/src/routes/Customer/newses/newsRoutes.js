import express from 'express';
import { getNews } from "../../../controllers/Customer/newsController/getNews.js"

const router = express.Router();

router.get('/get',getNews);


export default router;