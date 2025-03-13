import express from 'express';
import { notifyAdminOnCustomerChat } from '../../../controllers/Admin/notification/notifyAdminOnCustomerChat.js';

const router = express.Router();

router.post('/chat', notifyAdminOnCustomerChat);

export default router;
