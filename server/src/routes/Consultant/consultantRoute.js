import express from "express";
import authRoute from "./consultantRoutes/authRoute.js";
import consultantDetailsRoute from "./consultantRoutes/consultantDetailsRoute.js";
import consultantProfileRoute from "./consultantRoutes/consultantProfileRoute.js";
import withdraw from "./consultantRoutes/withdrawRoute.js";
import notificationRoute from "./consultantRoutes/notificationRoute.js";

import { protect } from "../../middlewares/authMiddleware.js";


const router = express.Router();

router.use("/auth", authRoute);
router.use("/consultantDetails", protect, consultantDetailsRoute);
router.use("/consultantProfile", protect, consultantProfileRoute);

router.use("/withdraw", protect, withdraw);
router.use("/notification",protect,notificationRoute)

export default router;
