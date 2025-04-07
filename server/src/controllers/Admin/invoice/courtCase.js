import {
    saveCourtCase,
    saveCourtDocuments,
    saveCourtPayment
} from "../../../helper/courtService/courtCaseHelper.js";

import Customer from "../../../models/Customer/customerModels/customerModel.js";
import mongoose from "mongoose";
import { notificationService } from "../../../service/sendPushNotification.js";


export const CreateCourtCase = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            customerId,
            serviceName,
            selectedServiceCountry,
            caseDescription,
            paymentAmount,
            paidCurrency
        } = req.body;

        // Validate customer
        const customer = await Customer.findById(customerId).lean();
        if (!customer) throw new Error("Invalid customer");

        if (!paymentAmount || !paidCurrency) throw new Error("Payment is required for registration.");

        const { courtCase, courtServiceID } = await saveCourtCase(
            {
                customerId,
                serviceName,
                selectedServiceCountry,
                caseDescription,
                casePaymentStatus: "paid",
                status: "submitted",
                paymentAmount,
                paidCurrency
            },
            session
        );

        if (req.files?.length > 0) {
            await saveCourtDocuments(req.files, courtCase._id, session);
        }

        await saveCourtPayment({
            courtCaseId: courtCase._id,
            paymentAmount,
            paidCurrency,
            paymentDate: new Date(),
            customerId
        }, session);

        await session.commitTransaction();
        session.endSession();

        // Notify Customer
        await notificationService.sendToCustomer(
            customerId,
            "Court Case Registered",
            "A court service request was manually added by the MUNJZ team."
        );


        return res.status(201).json({ message: "Court case registered successfully" });
    } catch (error) {
        console.error("Error in saveCourtServiceDetails:", error);
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};