import express from "express";
import authRoute from "./consultantRoutes/authRoute.js";
import idProofRoute from "./consultantRoutes/idProofRoutes.js";
import personalDetailRoute from "./consultantRoutes/personalDetailsRoute.js";
import bankDetailRoute from "./consultantRoutes/bankDetailsRoute.js";
import withdraw from "./consultantRoutes/withdrawRoute.js";
import notificationRoute from "./consultantRoutes/notificationRoute.js";

import { protect } from "../../middlewares/authMiddleware.js";


const router = express.Router();

router.use("/auth", authRoute);
router.use("/idproofcheck", protect, idProofRoute);
router.use("/personal", protect, personalDetailRoute);
router.use("/bank", protect, bankDetailRoute);
router.use("/withdraw", protect, withdraw);
router.use("/notification",protect,notificationRoute)

export default router;
