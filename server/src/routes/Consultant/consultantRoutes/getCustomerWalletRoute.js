import express from "express";
import { getCustomerWalletDatas} from "../../../controllers/Consultant/getDatasController.js";
import { validateConsultantId } from "../../../middlewares/validateId.js";
const router = express.Router();


router.get("/get-wallet/:customerId",getCustomerWalletDatas)

export default router;
