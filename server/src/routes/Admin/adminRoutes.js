import express from "express";
import authRoute from "./adminRoutes/authRoute.js";
import pricingRoute from "../Admin/services/consultation/pricingRoute.js";
import dividendRoute from "../Admin/services/consultation/dividendRoute.js";
import documentCheckRoute from "../Admin/adminRoutes/documentCheckRoute.js";
import withdrawRequestRoute from "../../routes/Admin/adminRoutes/withdrawRoute.js";
import courtServiceRoute from "./services/courtServices/courtServiceRoutes.js";
import notaryServiceRoute from "../Admin/services/notaryServices/notaryServiceRoute.js";
import courtServiceRequestRoute from "../Admin/services/courtServices/courtServiceRequestRoutes.js";
import adminFollowerUpdateRoute from "../Admin/adminRoutes/adminFollowerUpdateRoute.js";
import notaryServiceRequestRoute from "../Admin/services/notaryServices/notaryServiceReqRoutes.js";
import translationRoute from "../Admin/services/Translation/translationReqRoute.js";
import getAllConsultantDatasRoute from "./adminRoutes/getAllConsultantDatasRoute.js";
import invoiceRoute from "../Admin/invoice/invoiceRoute.js";
import adminNotificationRoutes from "./notification/notificationRoute.js";
import blockConsultantRoute from "./adminRoutes/blockUnblockConsultantRoute.js";
import adminNewsRoutes from "./adminRoutes/newsRoutes.js";
import customerRoutes from "./adminRoutes/customerRoutes.js";
import getAdminEarningsRoutes from "./adminRoutes/getAdminEarningsRoute.js";
import getConsultationRoute from "./services/consultation/consultationRoute.js"

import { protectAdmin } from "../../middlewares/adminMiddleware.js";

const router = express.Router();

// Authentication
router.use("/auth", authRoute);

// Pricing and Dividend Routes
router.use("/pricing", protectAdmin, pricingRoute);
router.use("/dividend", protectAdmin, dividendRoute);


// consultant Routes
router.use("/document-check", protectAdmin, documentCheckRoute);
router.use("/manageConsultant", protectAdmin, blockConsultantRoute);

// customer Routes
router.use("/manageCustomer", protectAdmin, customerRoutes);

// Withdraw Request Route
router.use("/withdrawals", protectAdmin, withdrawRequestRoute);

// Court Services Routes
router.use("/court-services", protectAdmin, courtServiceRoute);
router.use("/court-service-requests", courtServiceRequestRoute);

// Notary Services Routes
router.use("/notary-services", protectAdmin, notaryServiceRoute);
router.use("/notary-service-requests", notaryServiceRequestRoute);

// Translation Routes
router.use("/translations", protectAdmin, translationRoute);

// Payment and Invoice Routes
router.use("/getDatas", protectAdmin, getAllConsultantDatasRoute);
router.use("/invoices", protectAdmin, invoiceRoute);

// Admin-related Routes
router.use("/get-data",protectAdmin,getAdminEarningsRoutes)
router.use("/admin/follower-update", protectAdmin, adminFollowerUpdateRoute);
router.use("/admin", protectAdmin, adminNotificationRoutes);
router.use("/news", protectAdmin, adminNewsRoutes);
router.use("/get-datas",protectAdmin,getConsultationRoute)

export default router;
