import {
    saveNotaryCase,
    saveNotaryDocuments,
    saveNotaryPayment
} from "../../../helper/notaryService/notaryCaseHelper.js";
import Customer from "../../../models/Customer/customerModels/customerModel.js";
import { notificationService } from "../../../service/sendPushNotification.js";
import mongoose from "mongoose";


export const CreateNotaryCase = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const {
            customerId,
            serviceName,
            selectedServiceCountry,
            caseDescription,
            paymentAmount,
            paidCurrency,
        } = req.body;

        // Validate customer
        const customer = await Customer.findById(customerId).lean();
        if (!customer) throw new Error("Invalid customer");


        if (!paymentAmount || !paidCurrency)
            throw new Error("Payment is required for registration.");

        // Step 1: Save Notary Case
        const { notaryCase, notaryServiceID } = await saveNotaryCase(
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
            await saveNotaryDocuments(req.files, notaryCase._id, session);
        }


        await saveNotaryPayment(
            {
                notaryCaseId: notaryCase._id,
                paymentAmount,
                paidCurrency,
                paymentDate: new Date(),
                customerId
            },
            session
        );

        await session.commitTransaction();
        session.endSession();

        // Notify Customer
        await notificationService.sendToCustomer(
            customerId,
            "Notary Case Registered",
            "A court service request was manually added by the MUNJZ team."
        );
        return res.status(201).json({
            message: "Notary case registered successfully"
        });
    } catch (error) {
        console.error("Error in saveNotaryServiceDetails:", error);
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};