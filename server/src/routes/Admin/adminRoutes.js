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
import getAllServicesRoute from "./services/getAllServices/getAllServicesRoutes.js";
import promotionsRoute from "./adminRoutes/promotionRoutes.js";
import { protectAdmin } from "../../middlewares/adminMiddleware.js";


const router = express.Router();

// Authentication
router.use("/auth", authRoute);

// Pricing and Dividend Routes
router.use("/pricing",protectAdmin, pricingRoute);
router.use("/dividend",protectAdmin, dividendRoute);


// consultant Routes
router.use("/document-check",protectAdmin, documentCheckRoute);
router.use("/manageConsultant",protectAdmin, blockConsultantRoute);

// customer Routes
router.use("/manageCustomer",protectAdmin, customerRoutes);

// Withdraw Request Route
router.use("/withdrawals",protectAdmin, withdrawRequestRoute);

// Court Services Routes
router.use("/court-services",protectAdmin, courtServiceRoute);
router.use("/court-service-requests",protectAdmin, courtServiceRequestRoute);
router.use("/court-case",protectAdmin, courtCaseRoute);

// Notary Services Routes
router.use("/notary-services",protectAdmin, notaryServiceRoute);
router.use("/notary-service-requests",protectAdmin, notaryServiceRequestRoute);
router.use("/notary-case",protectAdmin, notaryCaseRoute);

// Translation Routes
router.use("/translations",protectAdmin, translationRoute);
router.use("/translation", protectAdmin,translationCaseRoute);

// Payment and Invoice Routes
router.use("/getDatas",protectAdmin, getAllConsultantDatasRoute);
router.use("/invoice",protectAdmin, invoiceRoute);

// Admin-related Routes
router.use("/get-data", protectAdmin,getAdminEarningsRoutes)
router.use("/admin/follower-update", protectAdmin,adminFollowerUpdateRoute);
router.use("/notifications",protectAdmin, adminNotificationRoutes);
router.use("/news", protectAdmin,adminNewsRoutes);
router.use("/get-datas",protectAdmin, getConsultationRoute)
router.use("/upload-icon",protectAdmin, uploadimage);
router.use("/notify-admin",protectAdmin, notifyAdminOnCustomerChatRoute);

router.use("/get-services",getAllServicesRoute);
router.use("/promotions",protectAdmin,promotionsRoute)

export default router;
