import Document from "../../../../models/Customer/notaryServiceModel/notaryServiceDocument.js";
import Transaction from "../../../../models/Customer/customerModels/transaction.js";
import AdditionalPayment from "../../../../models/Customer/customerModels/additionalTransaction.js";
import translationCase from "../../../../models/Customer/translationModel/translationDetails.js";
import { formatDate } from "../../../../helper/dateFormatter.js";

export const getCaseDetails = async (req, res, next) => {
    try {
        const { caseId } = req.params;

        // Fetch data in parallel with filtering
        const [caseDetails, documents, initialPayments, additionalPayment, pendingDocs, pendingPayments,adminUploads] = await Promise.all([
            translationCase.findById(caseId).lean(),
            Document.find({ notaryServiceCase: caseId }).lean(),
            Transaction.find({ caseId: caseId }).lean(),
            AdditionalPayment.find({ caseId: caseId, status: "paid" }).lean(),
            Document.find({ notaryServiceCase: caseId, status: "pending", documentType: "admin-request" }).lean(), // Only admin-requested docs
            AdditionalPayment.find({ caseId: caseId, status: "pending" }).lean(), // Only pending payments
            Document.find({ courtServiceCase: caseId, status: "submitted", documentType: "admin-upload" }).lean()
        ]);

        if (!caseDetails) {
            return res.status(404).json({ success: false, message: "Case not found" });
        }

        // Format dates
        caseDetails.createdAt = formatDate(caseDetails.createdAt);
        caseDetails.updatedAt = formatDate(caseDetails.updatedAt);

        documents.forEach(doc => {
            doc.uploadedAt = formatDate(doc.uploadedAt);
            doc.requestedAt = doc.requestedAt ? formatDate(doc.requestedAt) : null;
            doc.fulfilledAt = doc.fulfilledAt ? formatDate(doc.fulfilledAt) : null;
        });

       // Merge initial payments and additional payments into a single array
       const payments = [
        ...initialPayments,
        ...additionalPayment.map(payment => ({
            _id: payment._id,
            customerId: payment.customerId,
            caseId: payment.caseId,
            caseType: payment.caseType,
            serviceType: payment.serviceType,
            amountPaid: payment.amount,
            currency: payment.paidCurrency,
            requestReason: payment.requestReason,
            dueDate: payment.dueDate,
            status: payment.status,
            requestedAt: formatDate(payment.requestedAt),
            createdAt: formatDate(payment.createdAt),
            updatedAt: formatDate(payment.updatedAt),
            paymentDate: formatDate(payment.paymentDate || payment.updatedAt)
        }))
    ];

    // Format payment dates
    payments.forEach(payment => {
        payment.paymentDate = payment.paymentDate ? formatDate(payment.paymentDate) : formatDate(payment.updatedAt);
    });

    // Format dates for notifications
    const notifications = [...pendingDocs, ...pendingPayments, ...adminUploads].map(notification => ({
        ...notification,
        requestedAt: notification.requestedAt ? formatDate(notification.requestedAt) : null,
        uploadedAt: notification.uploadedAt ? formatDate(notification.uploadedAt) : null,
        createdAt: notification.createdAt ? formatDate(notification.createdAt) : null,
    }));


        res.status(200).json({
            message: "Case details fetched successfully",
            data: {
                ...caseDetails,
                documents,
                payments,
                notifications
            }
        });

    } catch (error) {
        next(error);
    }
};
