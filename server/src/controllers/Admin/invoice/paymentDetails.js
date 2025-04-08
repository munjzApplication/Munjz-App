import customerTransaction from '../../../models/Customer/customerModels/transaction.js';
import customerAdditionalTransaction from '../../../models/Customer/customerModels/additionalTransaction.js';
import customer from '../../../models/Customer/customerModels/customerModel.js';
import { formatDate } from "../../../helper/dateFormatter.js";
import mongoose from "mongoose";

export const getPaymentDetails = async (req, res, next) => {
    try {
        // Fetch paid transactions (from both collections)
        const [paidMain, paidAdditional] = await Promise.all([
            customerTransaction.find({ status: "paid" }).lean(),
            customerAdditionalTransaction.find({ status: "paid" }).lean()
        ]);

        const paidTransactions = [
            ...paidMain.map(payment => ({
                _id: payment._id,
                customerId: payment.customerId,
                caseId: payment.caseId,
                caseType: payment.caseType,
                serviceType: payment.serviceType,
                amount: payment.amountPaid,
                currency: payment.currency,
                requestReason: payment.requestReason,
                dueDate: payment.dueDate ? formatDate(payment.dueDate) : null,
                status: payment.status,
                paymentDate: payment.paymentDate ? formatDate(payment.paymentDate) : null,
                requestedAt: payment.requestedAt ? formatDate(payment.requestedAt) : null,
                createdAt: payment.createdAt,
                updatedAt: payment.updatedAt
            })),
            ...paidAdditional.map(payment => ({
                _id: payment._id,
                customerId: payment.customerId,
                caseId: payment.caseId,
                caseType: payment.caseType,
                serviceType: payment.serviceType,
                amount: payment.amountPaid ?? payment.amount,
                currency: payment.currency ?? payment.paidCurrency,
                requestReason: payment.requestReason,
                dueDate: payment.dueDate ? formatDate(payment.dueDate) : null,
                status: payment.status,
                paymentDate: payment.paymentDate ? formatDate(payment.paymentDate) : null,
                requestedAt: payment.requestedAt ? formatDate(payment.requestedAt) : null,
                createdAt: payment.createdAt,
                updatedAt: payment.updatedAt
            }))
        ];

        // Aggregation for pending transactions + customer email
        const pendingTransactions = await customerAdditionalTransaction.aggregate([
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
                    paymentDate: 1,
                    requestedAt: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    status: 1,
                    customerEmail: "$customer.email"
                }
            }
        ]);

        // Format date fields in pending
        const formattedPending = pendingTransactions.map(payment => ({
            ...payment,
            dueDate: payment.dueDate ? formatDate(payment.dueDate) : null,
            paymentDate: payment.paymentDate ? formatDate(payment.paymentDate) : null,
            requestedAt: payment.requestedAt ? formatDate(payment.requestedAt) : null,
        }));

        return res.status(200).json({
            message: "Payment details fetched successfully",
            paidTransactions,
            pendingTransactions: formattedPending
        });

    } catch (error) {
        next(error);
    }
};



export const editPaymentDetails = async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const { serviceType, amount } = req.body;

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
        payment.serviceType = serviceType;
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