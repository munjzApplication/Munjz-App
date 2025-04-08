import customerTransaction from '../../../models/Customer/customerModels/transaction.js';
import customerAdditionalTransaction from '../../../models/Customer/customerModels/additionalTransaction.js';
import customer from '../../../models/Customer/customerModels/customerModel.js';
import { formatDate } from "../../../helper/dateFormatter.js";
import mongoose from "mongoose";


// Reusable aggregation builder
const buildTransactionAggregation = (statusFilter) => ([
    { $match: { status: statusFilter } },
    {
        $lookup: {
            from: "customer_profiles",
            localField: "customerId",
            foreignField: "_id",
            as: "customer"
        }
    },
    { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
    {
        $lookup: {
            from: "courtservice_cases",
            localField: "caseId",
            foreignField: "_id",
            as: "courtCase"
        }
    },
    {
        $lookup: {
            from: "notaryservice_cases",
            localField: "caseId",
            foreignField: "_id",
            as: "notaryCase"
        }
    },
    {
        $lookup: {
            from: "translation_cases",
            localField: "caseId",
            foreignField: "_id",
            as: "translationCase"
        }
    },
    {
        $addFields: {
            serviceUniqueID: {
                $switch: {
                    branches: [
                        { case: { $eq: ["$caseType", "CourtService_Case"] }, then: { $arrayElemAt: ["$courtCase.courtServiceID", 0] } },
                        { case: { $eq: ["$caseType", "NotaryService_Case"] }, then: { $arrayElemAt: ["$notaryCase.notaryServiceID", 0] } },
                        { case: { $eq: ["$caseType", "Translation_Case"] }, then: { $arrayElemAt: ["$translationCase.translationServiceID", 0] } }
                    ],
                    default: null
                }
            },
            serviceName: {
                $switch: {
                    branches: [
                        { case: { $eq: ["$caseType", "CourtService_Case"] }, then: { $arrayElemAt: ["$courtCase.serviceName", 0] } },
                        { case: { $eq: ["$caseType", "NotaryService_Case"] }, then: { $arrayElemAt: ["$notaryCase.serviceName", 0] } },
                        { case: { $eq: ["$caseType", "Translation_Case"] }, then: { $arrayElemAt: ["$translationCase.serviceName", 0] } }
                    ],
                    default: null
                }
            }
        }
    },
    {
        $project: {
            _id: 1,
            customerId: 1,
            caseId: 1,
            caseType: 1,
            serviceType: 1,
            amount: { $ifNull: ["$amountPaid", "$amount"] },
            currency: { $ifNull: ["$currency", "$paidCurrency"] },
            requestReason: 1,
            dueDate: 1,
            status: 1,
            paymentDate: 1,
            requestedAt: 1,
            createdAt: 1,
            updatedAt: 1,
            customerEmail: "$customer.email",
            customerUniqueId: "$customer.customerUniqueId",
            customerName: "$customer.Name",
            serviceUniqueID: 1,
            serviceName: 1 
        }
    }
]);

export const getPaymentDetails = async (req, res, next) => {
    try {
        const [paidMain, paidAdditional, pendingAdditional] = await Promise.all([
            customerTransaction.aggregate(buildTransactionAggregation("paid")),
            customerAdditionalTransaction.aggregate(buildTransactionAggregation("paid")),
            customerAdditionalTransaction.aggregate(buildTransactionAggregation("pending")),
        ]);

        const formatTransactions = (transactions) =>
            transactions.map(payment => ({
                ...payment,
                dueDate: payment.dueDate ? formatDate(payment.dueDate) : null,
                paymentDate: payment.paymentDate ? formatDate(payment.paymentDate) : null,
                requestedAt: payment.requestedAt ? formatDate(payment.requestedAt) : null,
            }));

        res.status(200).json({
            message: "Payment details fetched successfully",
            paidTransactions: formatTransactions([...paidMain, ...paidAdditional]),
            pendingTransactions: formatTransactions(pendingAdditional)
        });

    } catch (error) {
        next(error);
    }
};




export const editPaymentDetails = async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const { amount } = req.body;

        // Find the payment document
        const payment = await customerAdditionalTransaction.findOne({
            caseId,
            status: "pending"
        });
        if (!payment) return res.status(404).json({ message: "Invalid case ID" });

        // Optional: validate customer exists (if needed)
        const customerDetails = await customer.findById(payment.customerId).lean();
        if (!customerDetails) return res.status(404).json({ message: "Invalid customer ID" });

        // Update fields

        payment.amount = amount;


        await payment.save();

        return res.status(200).json({
            message: "Payment details updated successfully",
            data: payment
        });
    } catch (error) {
        next(error);
    }
};


export const deletePaymentDetails = async (req, res, next) => {
    try {
        const { caseId } = req.params;

        const deletedPayment = await customerAdditionalTransaction.findOneAndDelete({
            status: "pending",
            caseId: caseId
        });

        if (!deletedPayment) {
            return res.status(404).json({ message: "Payment not found or already deleted" });
        }

        return res.status(200).json({
            message: "Payment deleted successfully",
            data: deletedPayment
        });
    } catch (error) {
        next(error);
    }
};