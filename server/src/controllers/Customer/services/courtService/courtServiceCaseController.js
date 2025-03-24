import {
    saveCourtCase,
    saveCourtDocuments,
    saveCourtPayment
} from "../../../../helper/courtService/courtCaseHelper.js";

import Customer from "../../../../models/Customer/customerModels/customerModel.js";
import CourtCase from "../../../../models/Customer/courtServiceModel/courtServiceDetailsModel.js";
import mongoose from "mongoose";
import { formatDatewithmonth } from "../../../../helper/dateFormatter.js";
import { notificationService } from "../../../../service/sendPushNotification.js";


export const saveCourtServiceDetails = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const customerId = req.user._id;
        const { 
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
                status: "submitted" 
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
            `Your court case for ${serviceName} in ${selectedServiceCountry} has been registered successfully.`
        );

        // Notify Admin
        await notificationService.sendToAdmin(
            "New Court Case Submitted",
            `A new court case (${serviceName}) has been registered by ${customer.Name} in ${selectedServiceCountry} .`
        );
        return res.status(201).json({ message: "Court case registered successfully" });
    } catch (error) {
        console.error("Error in saveCourtServiceDetails:", error);
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

export const getAllCourtCases = async (req, res, next) => {
    try {
        const customerId = req.user._id;

        const courtCases = await CourtCase.aggregate([
            { $match: { customerId } },
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: "customer_transactions", 
                    localField: "_id",  
                    foreignField: "caseId",
                    as: "paymentDetails"
                }
            },
            {
                $addFields: {
                    totalAmountPaid: { 
                        $sum: "$paymentDetails.amountPaid" 
                    },
                    paidCurrency: { 
                        $ifNull: [{ $arrayElemAt: ["$paymentDetails.currency", 0] }, "N/A"] 
                    }
                }
            },
            {
                $project: {
                    createdAt: 1,
                    courtServiceID: 1,
                    serviceName: 1,
                    selectedServiceCountry: 1,
                    caseDescription: 1,
                    casePaymentStatus: 1,
                    follower: 1,
                    status: 1,
                    amount: { $ifNull: ["$totalAmountPaid", 0] },  
                    paidCurrency: 1
                }
            }
        ]);

        const formattedCases = courtCases.map(caseItem => ({
            ...caseItem,
            createdAt: formatDatewithmonth(caseItem.createdAt)
        }));

        return res.status(200).json({ message: "Court cases fetched successfully", formattedCases });
    } catch (error) {
        next(error);
    }
};

