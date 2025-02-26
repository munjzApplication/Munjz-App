import {
    saveCourtCase,
    saveCourtDocuments,
    saveCourtPayment
} from "../../../../helper/courtService/courtCaseHelper.js";

import Customer from "../../../../models/Customer/customerModels/customerModel.js";
import CourtCase from "../../../../models/Customer/courtServiceModel/courtServiceDetailsModel.js";
import mongoose from "mongoose";
import { formatDatewithmonth } from "../../../../helper/dateFormatter.js";

export const saveCourtServiceDetails = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const customerId = req.user._id;
        const { serviceName, selectedServiceCountry, caseDescription, paymentAmount, paidCurrency, paymentDate } = req.body;

        // Validate customer
        const customer = await Customer.findById(customerId).lean();
        if (!customer) throw new Error("Invalid customer");

        if (!paymentAmount || !paidCurrency) throw new Error("Payment is required for registration.");

        const { courtCase, courtServiceID } = await saveCourtCase(
            { customerId, serviceName, selectedServiceCountry, caseDescription, casePaymentStatus: "paid", status: "submitted" },
            session
        );

        if (req.files?.length > 0) {
            await saveCourtDocuments(req.files, courtCase._id, session);
        }

        await saveCourtPayment({
            courtCaseId: courtCase._id,
            paymentAmount,
            paidCurrency,
            serviceName,
            selectedServiceCountry,
            paymentDate,
            customerName: customer.Name,
            customerId
        }, session);

        await session.commitTransaction();
        session.endSession();

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
                    from: "courtservice_payments",  // Ensure correct collection name
                    localField: "_id",
                    foreignField: "courtServiceCase",
                    as: "paymentDetails"
                }
            },
            { $unwind: { path: "$paymentDetails", preserveNullAndEmptyArrays: true } },
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
                    amount: { $ifNull: ["$paymentDetails.amount", 0] },  // Handle missing values
                    paidCurrency: { $ifNull: ["$paymentDetails.paidCurrency", "N/A"] }
                }
            }
        ]);
        
        const formattedCases = courtCases.map(caseItem => ({
            ...caseItem,
            createdAt: formatDatewithmonth(caseItem.createdAt)
        }));
        console.log("Court Cases:", formattedCases);
        

        return res.status(200).json({ message: "Court cases fetched successfully", formattedCases });
    } catch (error) {
        next(error);
    }
};
