import express from "express";
import authRoute from "./customerRoutes/authRoute.js";
import profileRoute from "./customerRoutes/profileRoute.js";
import customerForgotRoute from "./customerRoutes/customerForgotRoute.js";
import callActivity from "./customerRoutes/callActivityRoutes.js";
import transactionRoute from "./services/consultation/transactionRoute.js";
import favRoute from "./services/consultation/favRoute.js";
import courtServiceRoute from './services/courtServices/courtServiceRoute.js';
import courtServiceReqRoute from './services/courtServices/courtServiceReqRoute.js';
import notaryServiceRoute from './services/notaryServices/notaryServiceRoute.js';
import notaryServiceReqRoute from './services/notaryServices/notaryServiceReqRoute.js';
import translationRoute from './services/translation/translationRoute.js';
import adminreqinvoiceRoute from './invoice/getAllAdminReq.js';
import customerPendingsRoute from './customerRoutes/customerPendings.js';
import notificationRoute from "./notifications/notificationRoute.js";
import getConsultantListRoutes from "./consultantRoutes/getConsultantListRoute.js";
import getPricingRoutes from "./customerRoutes/getPricingRoute.js";
import getDataRoutes from "./customerRoutes/getDataRoute.js";
import consultationRoute from "./services/consultation/consultationRoute.js";
import getNews from "./newses/newsRoutes.js";

import {authenticateUser} from '../../middlewares/customerMiddleware.js';


const router = express.Router();

router.use("/auth", authRoute);
router.use("/profile",authenticateUser, profileRoute);
router.use("/forgot-password", customerForgotRoute);
router.use("/activity",authenticateUser, callActivity);
router.use('/transaction',authenticateUser,transactionRoute);
router.use('/favorite',authenticateUser,favRoute);
router.use('/court-service',authenticateUser,courtServiceRoute);
router.use('/adminCourt-req-submit',authenticateUser,courtServiceReqRoute);
router.use('/notary-service',authenticateUser,notaryServiceRoute);
router.use('/adminNotary-req-submit',authenticateUser,notaryServiceReqRoute);
router.use('/translation',authenticateUser,translationRoute);
router.use('/adminreqinvoice',authenticateUser,adminreqinvoiceRoute);
router.use('/pendings',authenticateUser,customerPendingsRoute);
router.use("/notifications",authenticateUser,notificationRoute)
router.use('/consultant-list',authenticateUser,getConsultantListRoutes);
router.use('/pricing',authenticateUser,getPricingRoutes); 
router.use('/get-datas',authenticateUser,getDataRoutes);
router.use('/news',authenticateUser,getNews)

// Consultation Routesut
router.use("/consultations",authenticateUser, consultationRoute);


export default router;
