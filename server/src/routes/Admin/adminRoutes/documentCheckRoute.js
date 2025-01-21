import express from 'express';
import {handleDocumentStatus} from '../../../controllers/Admin/adminControllers/documentCheckController.js';
const router = express.Router()

router.patch('/appove-reject/:consultantId' ,handleDocumentStatus);



export default router;