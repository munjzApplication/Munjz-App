import DocumentModel from "../../../../models/Customer/notaryServiceModel/notaryServiceDocument.js";
import AdditionalDocument from "../../../../models/Customer/notaryServiceModel/notaryServiceAdditionalDocuments.js";
import Payment from "../../../../models/Customer/notaryServiceModel/notaryServicePayment.js";
import AdditionalPayment from "../../../../models/Customer/notaryServiceModel/notaryServiceAdditionalPayment.js";
import { uploadFileToS3 } from "../../../../utils/s3Uploader.js";
import Notification from "../../../../models/Admin/notificationModels/notificationModel.js";

import NotaryCase from "../../../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import Customer from "../../../../models/Customer/customerModels/customerModel.js";

export const uploadAdminRequestedDocument = async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const { files } = req;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded." });
    }

    const currentTime = new Date();
    const uploadedDocuments = [];

    // Upload the documents to S3 and gather the URLs
    for (const file of files) {
      try {
        const documentUrl = await uploadFileToS3(file, "notarycaseDocs");
        uploadedDocuments.push({
          documentUrl,
          uploadedAt: currentTime
        });
      } catch (uploadError) {
        console.error("Error uploading file:", uploadError);
        return res.status(500).json({
          message: `Error uploading file: ${file.originalname}`,
          error: uploadError.message
        });
      }
    }

    const notaryCase = await NotaryCase.findOne({ _id: caseId });
    if (!notaryCase) {
      return res.status(404).json({ message: "Court case not found." });
    }

    const customer = await Customer.findById(notaryCase.customerID);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    let existingDocument = await AdditionalDocument.findOne({
      notaryServiceCase: caseId
    });

    if (existingDocument) {
      existingDocument.documents = uploadedDocuments;
      existingDocument.requestStatus = "updated";
      existingDocument.requestUpdatedAt = currentTime;

      await existingDocument.save();

      const notaryServiceID = existingDocument.notaryServiceID;
      const serviceName = notaryCase.serviceName;
      const customerName = customer.Name || "Unknown Customer";

      const notification = new Notification({
        notificationDetails: {
          type: "Document Update",
          title: "Admin Requested Document Updated",
          message: `The requested documents for notary Case ID: ${notaryServiceID}, have been successfully uploaded by ${customerName}.`,
          additionalDetails: {
            caseId,
            notaryServiceID,
            serviceName,
            documentCount: uploadedDocuments.length,
            customerName
          }
        }
      });
      await notification.save();

      return res.status(200).json({
        message: "Documents uploaded and request status updated to 'updated'.",
        additionalDocument: existingDocument
      });
    } else {
      // If no existing document is found, create a new entry with 'pending' status
      const newAdditionalDocument = new AdditionalDocument({
        notaryServiceCase: caseId,
        notaryServiceID,
        documents: [],
        requestReason: requestReason || "No reason provided",
        requestStatus: "pending",
        requestUpdatedAt: currentTime
      });

      await newAdditionalDocument.save();

      return res.status(201).json({
        message:
          "Document entry created with 'pending' status. Please wait for customer upload.",
        additionalDocument: newAdditionalDocument
      });
    }
  } catch (error) {
    console.error("Error uploading documents:", error);
    res.status(500).json({
      message: "Error uploading documents.",
      error: error.message
    });
  }
};

export const getDocummentByCaseId = async (req, res, next) => {
  try {
    const { caseId } = req.params;

    const documents = await DocumentModel.find({ notaryServiceCase: caseId });

    if (!documents || documents.length === 0) {
      return res
        .status(404)
        .json({ message: "No documents found for the given case ID" });
    }

    res.status(200).json({
      message: "documents retrieved successfully",
      documents
    });
  } catch (error) {
    next(error);
  }
};

export const submitAdditionalPayment = async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const { transactionId, paymentMethod, paymentDate } = req.body;

    if (!transactionId || !paymentMethod || !paymentDate) {
      return res.status(400).json({
        message:
          "All fields are required (transactionId, paymentMethod, paymentDate)."
      });
    }

    // Find the additional payment record by caseId
    const payment = await AdditionalPayment.findOne({ caseId });
    if (!payment) {
      return res
        .status(404)
        .json({ message: "Additional payment record not found for the given case ID." });
    }

    if (payment.paymentStatus === "paid") {
      return res.status(400).json({
        message: "This additional payment has already been paid."
      });
    }

    // Update the payment status to 'paid'
    const updatedPayment = await AdditionalPayment.updateOne(
      { _id: payment._id },
      {
        $set: {
          transactionId: transactionId,
          paymentMethod: paymentMethod,
          paymentDate: paymentDate,
          paymentStatus: "paid",
          paidAt: new Date()
        }
      }
    );

    if (updatedPayment.modifiedCount === 0) {
      return res
        .status(500)
        .json({ message: "Failed to update payment status." });
    }

    // Get Court Case and Customer details for the notification
    const notaryCase = await NotaryCase.findOne({ _id: caseId });
    if (!notaryCase) {
      return res.status(404).json({ message: "Notary case not found." });
    }

    const customer = await Customer.findById(notaryCase.customerID);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    const notaryServiceID = notaryCase.notaryServiceID;
    const serviceName = notaryCase.serviceName;
    const customerName = customer.Name || "Unknown Customer";

    const notification = new Notification({
      notificationDetails: {
        type: "Payment",
        title: "Additional Payment Received",
        message: `An additional payment of ${payment.amount} has been successfully received for case ID ${notaryServiceID}, Payment made by ${customerName}.`,
        additionalDetails: {
          caseId: payment.caseId,
          transactionId,
          amount: payment.amount,
          serviceName,
          customerName,
          paymentStatus: "paid"
        }
      }
    });

    await notification.save();

    res.status(200).json({
      message: "Additional payment submitted successfully.",
      additionalDetails: payment
    });
  } catch (error) {
    next(error);
  }
};
















export const getPaymentsByCaseId = async (req, res, next) => {
  try {
    const { caseId } = req.params;

    console.log("Received caseId:", caseId);

    const payments = await Payment.find({ notaryServiceCase: caseId });
    const additionalPayment = await AdditionalPayment.find({ caseId: caseId });

    console.log("payments", payments);
    console.log("additional Payments", additionalPayment);

    if (!payments || payments.length === 0) {
      return res
        .status(404)
        .json({ message: "No payments found for the given case ID" });
    }

    res.status(200).json({
      message: "Payments retrieved successfully",
      payments,
      additionalPayment
    });
  } catch (error) {
    next(error);
  }
};
