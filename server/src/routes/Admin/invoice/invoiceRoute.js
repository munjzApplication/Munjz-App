import express from 'express';
import { CreateCase } from '../../../controllers/Admin/invoice/invoiceCreateController.js';
import { CreateCourtCase } from '../../../controllers/Admin/invoice/courtCase.js';
import { CreateNotaryCase } from '../../../controllers/Admin/invoice/notaryCase.js';
import { CreateTranslation } from '../../../controllers/Admin/invoice/translationCase.js';

import upload from "../../../middlewares/fileUpload.js";
const router = express.Router();


router.post('/create-case', CreateCase);

router.post('/court-cases',upload.array("documents"), CreateCourtCase);
router.post('/notary-cases',upload.array("documents"), CreateNotaryCase);
router.post('/translations',upload.array("documents"), CreateTranslation);


export default router;
