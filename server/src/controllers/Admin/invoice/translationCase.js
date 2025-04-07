import {
    saveTranslationCase,
    saveTranslationDocuments,
    saveTranslationPayment
} from "../../../helper/translation/translationHelper.js";
import Customer from "../../../models/Customer/customerModels/customerModel.js";
import mongoose from "mongoose";
import { notificationService } from "../../../service/sendPushNotification.js";
import fs from "fs";
import path from "path";


export const CreateTranslation = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const {
            customerId,
            documentLanguage,
            translationLanguage,
            paymentAmount,
            paidCurrency,
            noOfPage
        } = req.body;


        // Validate customer existence
        const customer = await Customer.findById(customerId).lean();
        if (!customer) throw new Error("Invalid customer");

        const customerName = customer.Name;
        if (!documentLanguage) throw new Error("Document language is required.");
        if (!translationLanguage) throw new Error("Translation language is required.");

        if (paymentAmount && !paidCurrency) throw new Error("Paid currency is required for payment.");

        // Determine Payment Status
        const PaymentStatus = paymentAmount ? "paid" : "unpaid";

        // Save Translation Case
        const { translationCase } = await saveTranslationCase(
            {
                customerId,
                documentLanguage,
                translationLanguage,
                PaymentStatus,
                submissionDate: new Date(),
                status: "submitted",
                paymentAmount,
                paidCurrency
            },
            session
        );

        // Save Translation Documents
        if (req.files?.length > 0) {
            await saveTranslationDocuments(req.files, translationCase._id, noOfPage, session);
        } else {
            // Add dummy document if no file uploaded
            const dummyPath = path.join(process.cwd(), 'src', 'public', 'asset', 'invoice.png');

            const dummyFile = {
                originalname: "invoice.png",
                mimetype: "image/png",
                buffer: fs.readFileSync(dummyPath),
                size: fs.statSync(dummyPath).size,
            };

            await saveTranslationDocuments([dummyFile], translationCase._id, noOfPage, session);
        }

        // Save Payment Details only if paymentAmount exists
        if (paymentAmount) {
            await saveTranslationPayment(
                {
                    translationCaseId: translationCase._id,
                    paymentAmount,
                    paidCurrency,
                    customerName,
                    customerId
                },
                session
            );
        }

        await session.commitTransaction();
        session.endSession();

        // Send Notifications
        const paymentMessage = paymentAmount ? ` with a payment of ${paymentAmount} ${paidCurrency}.` : " without payment.";

        // Notify Customer
        await notificationService.sendToCustomer(
            customerId,
            "Translation Registered",
            "A court service request was manually added by the MUNJZ team."
        );

        return res.status(201).json({
            message: "Translation request submitted successfully",
        });

    } catch (error) {
        console.log("Error in submitting translation request", error);
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};