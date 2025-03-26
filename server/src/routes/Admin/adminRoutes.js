import express from "express";
import authRoute from "./adminRoutes/authRoute.js";
import pricingRoute from "../Admin/services/consultation/pricingRoute.js";
import dividendRoute from "../Admin/services/consultation/dividendRoute.js";
import documentCheckRoute from "../Admin/adminRoutes/documentCheckRoute.js";
import withdrawRequestRoute from "../../routes/Admin/adminRoutes/withdrawRoute.js";
import courtServiceRoute from "./services/courtServices/courtServiceRoutes.js";
import courtCaseRoute from "../Admin/services/courtServices/courtCaseRoutes.js";
import notaryServiceRoute from "../Admin/services/notaryServices/notaryServiceRoute.js";
import notaryCaseRoute from "../Admin/services/notaryServices/notaryCaseRoutes.js";
import courtServiceRequestRoute from "../Admin/services/courtServices/courtServiceRequestRoutes.js";
import adminFollowerUpdateRoute from "../Admin/adminRoutes/adminFollowerUpdateRoute.js";
import notaryServiceRequestRoute from "../Admin/services/notaryServices/notaryServiceReqRoutes.js";
import translationRoute from "../Admin/services/Translation/translationReqRoute.js";
import translationCaseRoute from "../Admin/services/Translation/translationRoutes.js";
import getAllConsultantDatasRoute from "./adminRoutes/getAllConsultantDatasRoute.js";
import invoiceRoute from "../Admin/invoice/invoiceRoute.js";
import adminNotificationRoutes from "./notification/notificationRoute.js";
import blockConsultantRoute from "./adminRoutes/blockUnblockConsultantRoute.js";
import adminNewsRoutes from "./adminRoutes/newsRoutes.js";
import customerRoutes from "./adminRoutes/customerRoutes.js";
import getAdminEarningsRoutes from "./adminRoutes/getAdminEarningsRoute.js";
import getConsultationRoute from "./services/consultation/consultationRoute.js";
import uploadimage from "./adminRoutes/uploadimage.js";
import notifyAdminOnCustomerChatRoute from "./notification/admin-notifyRoute.js";
import { protectAdmin } from "../../middlewares/adminMiddleware.js";


const router = express.Router();

// Authentication
router.use("/auth", authRoute);

// Pricing and Dividend Routes
router.use("/pricing", pricingRoute);
router.use("/dividend", dividendRoute);


// consultant Routes
router.use("/document-check", documentCheckRoute);
router.use("/manageConsultant", blockConsultantRoute);

// customer Routes
router.use("/manageCustomer", customerRoutes);

// Withdraw Request Route
router.use("/withdrawals", withdrawRequestRoute);

// Court Services Routes
router.use("/court-services", courtServiceRoute);
router.use("/court-service-requests", courtServiceRequestRoute);
router.use("/court-case", courtCaseRoute);

// Notary Services Routes
router.use("/notary-services", notaryServiceRoute);
router.use("/notary-service-requests", notaryServiceRequestRoute);
router.use("/notary-case", notaryCaseRoute);

// Translation Routes
router.use("/translations", translationRoute);
router.use("/translation", translationCaseRoute);

// Payment and Invoice Routes
router.use("/getDatas", getAllConsultantDatasRoute);
router.use("/invoices", invoiceRoute);

// Admin-related Routes
router.use("/get-data", getAdminEarningsRoutes)
router.use("/admin/follower-update", adminFollowerUpdateRoute);
router.use("/notifications", adminNotificationRoutes);
router.use("/news", adminNewsRoutes);
router.use("/get-datas", getConsultationRoute)
router.use("/upload-icon", uploadimage);
router.use("/notify-admin", notifyAdminOnCustomerChatRoute);

export default router;
