import Document from "../../../../models/Customer/courtServiceModel/courtServiceDocument.js";
import Transaction from "../../../../models/Customer/customerModels/transaction.js";
import AdditionalPayment from "../../../../models/Customer/customerModels/additionalTransaction.js";
import courtCase from "../../../../models/Customer/courtServiceModel/courtServiceDetailsModel.js";
import { formatDate } from "../../../../helper/dateFormatter.js";

export const getCaseDetails = async (req, res, next) => {
    try {
        const { caseId } = req.params;

        // Fetch data in parallel with filtering
        const [caseDetails, documents, payments, pendingDocs, pendingPayments,adminUploads] = await Promise.all([
            courtCase.findById(caseId).lean(),
            Document.find({ courtServiceCase: caseId }).lean(),
            Transaction.find({ caseId: caseId }).lean(),
            Document.find({ courtServiceCase: caseId, status: "pending", documentType: "admin-request" }).lean(), 
            AdditionalPayment.find({ caseId: caseId, status: "pending" }).lean(), 
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

        payments.forEach(payment => {
            payment.paymentDate = formatDate(payment.paymentDate);
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
