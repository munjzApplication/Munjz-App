import DocumentModel from "../../../../models/Customer/courtServiceModel/courtServiceDocument.js";
import AdditionalDocument from "../../../../models/Customer/courtServiceModel/courtServiceAdditionalDocuments.js";
import Payment from "../../../../models/Customer/courtServiceModel/courtServicePayment.js";
import AdditionalPayment from "../../../../models/Customer/courtServiceModel/courtServiceAdditionalPayment.js";
import { uploadFileToS3 } from "../../../../utils/s3Uploader.js";
import CourtCase from "../../../../models/Customer/courtServiceModel/courtServiceDetailsModel.js";
import Customer from "../../../../models/Customer/customerModels/customerModel.js";
import mongoose from "mongoose";

export const uploadCustomerAdditionalDocument = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { caseId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "No files uploaded." });
    }

    // Step 1: Upload files to S3 and get URLs
    const documentUrls = [];
    for (const file of files) {
      const documentUrl = await uploadFileToS3(file, "CourtCaseDocs");
      documentUrls.push({ documentUrl });
    }

    // Step 2: Create a new additional document entry
    const newDocument = await DocumentModel.create(
      [
        {
          courtServiceCase: caseId,
          documents: documentUrls,
          uploadedBy: "customer",
          documentType: "additional",
          status: "submitted",
          uploadedAt: new Date(),
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "Additional document uploaded successfully.",
      document: newDocument[0], // Since `create` returns an array
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      message: "Failed to upload additional document.",
      error: error.message,
    });
  }
};

export const uploadAdminRequestedDocument = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { caseId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "No files uploaded." });
    }

     // Step 1: Check if an admin requested a document for this case
     const requestedDocument = await DocumentModel.findOne({
      courtServiceCase: caseId,
      documentType: "admin-request",
      status: "pending", // Ensure it's an open request
    }).session(session);
console.log("requestedDocument",requestedDocument);

    if (!requestedDocument) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        message: "No pending admin-requested document found for this case.",
      });
    }

    // Step 2: Upload files to S3 and get their URLs
    const documentUrls = [];
    for (const file of files) {
      const documentUrl = await uploadFileToS3(file, "CourtCaseDocs");
      documentUrls.push({ documentUrl });
    }

    // Step 3: Update the existing requested document
    const updatedDocument = await DocumentModel.findByIdAndUpdate(
      requestedDocument._id,
      {
        $set: {
          documents: documentUrls, // Add uploaded documents
          status: "submitted", // Mark as fulfilled
          fulfilledAt: new Date(),
        },
      },
      { new: true, session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Admin-requested document uploaded successfully.",
      document: updatedDocument,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    res.status(500).json({
      message: "Failed to upload requested document.",
      error: error.message,
    });
  }
};

export const getDocummentByCaseId = async (req, res, next) => {
  try {
    const { caseId } = req.params;

    console.log("Received caseId:", caseId);

    const documents = await DocumentModel.find({ courtServiceCase: caseId });

    console.log("documents", documents);

    if (!documents || documents.length === 0) {
      return res
        .status(404)
        .json({ message: "No documents found for the given case ID" });
    }

    res.status(200).json({
      message: "Documents retrieved successfully",
      documents
    });
  } catch (error) {
    next(error);
  }
};

export const submitAdditionalPayment = async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const { transactionId, paymentMethod, paymentDate, amount } = req.body;

    // Validate required fields
    if (!transactionId || !paymentMethod || !paymentDate || !amount) {
      return res.status(400).json({
        message:
          "All fields are required (transactionId, paymentMethod, paymentDate, amount)."
      });
    }

    // Find the additional payment record by caseId
    const payment = await AdditionalPayment.findOne({ caseId });
    if (!payment) {
      return res
        .status(404)
        .json({ message: "Additional payment record not found for the given case ID." });
    }

    // Check if the payment is already marked as paid
    if (payment.paymentStatus === "paid") {
      return res.status(400).json({
        message: "This additional payment has already been paid."
      });
    }

    // Validate the amount
    if (payment.amount !== amount) {
      return res.status(400).json({
        message: `Payment amount mismatch. Expected ${payment.amount}, but received ${amount}.`
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
    const courtCase = await CourtCase.findOne({ _id: caseId });
    if (!courtCase) {
      return res.status(404).json({ message: "Court case not found." });
    }

    const customer = await Customer.findById(courtCase.customerID);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    const courtServiceID = courtCase.courtServiceID;
    const serviceName = courtCase.serviceName;
    const customerName = customer.Name || "Unknown Customer";


    // Send response
    res.status(200).json({
      message: "Additional payment submitted successfully.",
      additionalDetails: {
        caseId,
        transactionId,
        paymentMethod,
        paymentDate,
        amount,
        paymentStatus: "paid"
      }
    });
  } catch (error) {
    next(error);
  }
};


export const getPaymentsByCaseId = async (req, res, next) => {
  try {
    const { caseId } = req.params;

    const payments = await Payment.find({ courtServiceCase: caseId });
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
