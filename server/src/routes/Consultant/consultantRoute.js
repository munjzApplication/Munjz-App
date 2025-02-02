import express from "express";
import authRoute from "./consultantRoutes/authRoute.js";
import consultantDetailsRoute from "./consultantRoutes/consultantDetailsRoute.js";
import consultantProfileRoute from "./consultantRoutes/consultantProfileRoute.js";
import consultantForgotRoute from "./consultantRoutes/consultantForgotRoute.js";
import consultantGetRoute from "./consultantRoutes/getDatasRoute.js";
import withdraw from "./consultantRoutes/withdrawRoute.js";
import notificationRoute from "./consultantRoutes/notificationRoute.js";
import consultantreuploadRoute from "./consultantRoutes/reUploadDocumentsRoute.js";
import consultationDurationRoute from "./consultantRoutes/consultantationDurationRoute.js"

import { protect } from "../../middlewares/authMiddleware.js";


const router = express.Router();

router.use("/auth", authRoute);
router.use("/consultantDetails", protect, consultantDetailsRoute);
router.use("/consultantProfile", protect,consultantProfileRoute);
router.use("/consulatntForgot", consultantForgotRoute);
router.use("/reupload", protect, consultantreuploadRoute);

router.use("/withdraw", protect, withdraw);
router.use("/notification",protect,notificationRoute)
router.use("/get-Datas",protect,consultantGetRoute)
router.use("/call-manage",consultationDurationRoute)

export default router;
