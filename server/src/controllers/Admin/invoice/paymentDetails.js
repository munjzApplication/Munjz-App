import customerTransaction from '../../../models/Customer/customerModels/transaction.js';
import customerAdditionalTransaction from '../../../models/Customer/customerModels/additionalTransaction.js';
import customer from '../../../models/Customer/customerModels/customerModel.js';
import { formatDate } from "../../../helper/dateFormatter.js";
import mongoose from "mongoose";

export const getPaymentDetails = async (req, res, next) => {
    try {
        // Aggregated paid transactions (main)
        const paidMainAgg = customerTransaction.aggregate([
            { $match: { status: "paid" } },
            {
                $lookup: {
                    from: "customer_profiles",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customer"
                }
            },
            { $unwind: "$customer" },
            {
                $project: {
                    _id: 1,
                    customerId: 1,
                    caseId: 1,
                    caseType: 1,
                    serviceType: 1,
                    amount: "$amountPaid",
                    currency: "$currency",
                    requestReason: 1,
                    dueDate: 1,
                    status: 1,
                    paymentDate: 1,
                    requestedAt: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    customerEmail: "$customer.email",
                    customerUniqueId: "$customer.customerUniqueId"
                }
            }
        ]);

        // Aggregated paid additional transactions
        const paidAdditionalAgg = customerAdditionalTransaction.aggregate([
            { $match: { status: "paid" } },
            {
                $lookup: {
                    from: "customer_profiles",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customer"
                }
            },
            { $unwind: "$customer" },
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
                    customerUniqueId: "$customer.customerUniqueId"
                }
            }
        ]);

        // Wait for both aggregates in parallel
        const [paidMain, paidAdditional] = await Promise.all([paidMainAgg, paidAdditionalAgg]);

        const paidTransactions = [...paidMain, ...paidAdditional].map(payment => ({
            ...payment,
            dueDate: payment.dueDate ? formatDate(payment.dueDate) : null,
            paymentDate: payment.paymentDate ? formatDate(payment.paymentDate) : null,
            requestedAt: payment.requestedAt ? formatDate(payment.requestedAt) : null,
        }));

        // Pending Transactions Aggregation
        const pendingTransactionsRaw = await customerAdditionalTransaction.aggregate([
            { $match: { status: "pending" } },
            {
                $lookup: {
                    from: "customer_profiles",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customer"
                }
            },
            { $unwind: "$customer" },
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
                    customerUniqueId: "$customer.customerUniqueId"
                }
            }
        ]);

        const pendingTransactions = pendingTransactionsRaw.map(payment => ({
            ...payment,
            dueDate: payment.dueDate ? formatDate(payment.dueDate) : null,
            paymentDate: payment.paymentDate ? formatDate(payment.paymentDate) : null,
            requestedAt: payment.requestedAt ? formatDate(payment.requestedAt) : null,
        }));

        return res.status(200).json({
            message: "Payment details fetched successfully",
            paidTransactions,
            pendingTransactions
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