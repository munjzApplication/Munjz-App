import Document from "../../../../models/Customer/courtServiceModel/courtServiceDocument.js";
import AdditionalDocument from "../../../../models/Customer/courtServiceModel/courtServiceAdditionalDocuments.js";
import AdditionalPayment from "../../../../models/Customer/courtServiceModel/courtServiceAdditionalPayment.js";
import Payment from "../../../../models/Customer/courtServiceModel/courtServicePayment.js";
import { uploadFileToS3 } from "../../../../utils/s3Uploader.js";
import AdminUploadedDocument from "../../../../models/Admin/courtServiceModels/adminUploadedDocument.js";
import Customer from "../../../../models/Customer/customerModels/customerModel.js";
import CourtCase from "../../../../models/Customer/courtServiceModel/courtServiceDetailsModel.js";
import mongoose from "mongoose";

export const requestDocument = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { caseId } = req.params;
    const { reason } = req.body;

    // Step 1: Validate if the case exists
    const courtCase = await CourtCase.findById(caseId).session(session);
    if (!courtCase) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Court case not found." });
    }

    // Step 2: Create document request
    const documentRequest = await Document.create(
      [
        {
          courtServiceCase: caseId,
          uploadedBy: "admin",
          documentType: "admin-request",
          status: "pending",
          requestedAt: new Date(),
          requestReason: reason,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "Document request created successfully.",
      documentRequest: documentRequest[0], // Since `create` returns an array
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      message: "Failed to create document request.",
      error: error.message,
    });
  }
};
export const reviewDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const { status } = req.body;
    const courtCase = await CourtCase.findOne({ _id: caseId });
    if (!courtCase) {
      return res.status(404).json({ message: "Court case not found." });
    }

    const customer = await Customer.findById(courtCase.customerID);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status provided." });
    }

    const document = await Document.findById(documentId);
    if (!document)
      return res.status(404).json({ message: "Document not found." });

    document.requestStatus = status;
    document.requestUpdatedAt = new Date();

    await document.save();

    res.status(200).json({
      message: `Document marked as ${status} successfully.`,
      document
    });
  } catch (error) {
    next(error);
  }
};

export const requestAdditionalPayment = async (req, res, next) => {
  try {
    const { caseId } = req.params;

    const courtCase = await CourtCase.findOne({ _id: caseId });
    if (!courtCase) {
      return res.status(404).json({ message: "Court case not found." });
    }

    const customer = await Customer.findById(courtCase.customerID);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    const { amount, paidCurrency, requestReason, dueDate } = req.body;
    if (!amount || !paidCurrency || !requestReason || !dueDate) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const mainPayment = await Payment.findOne({ courtServiceCase: caseId });

    // Determine courtServiceID and serviceName
    const courtServiceID = mainPayment
      ? mainPayment.courtServiceID
      : courtCase.courtServiceID;
    const serviceName = mainPayment
      ? mainPayment.serviceName
      : courtCase.serviceName;

    // Create a new additional payment request
    const newAdditionalPayment = new AdditionalPayment({
      caseId,
      courtServiceID,
      serviceName,
      amount,
      paidCurrency,
      requestReason,
      dueDate,
      paymentStatus: "pending",
      requestedAt: new Date()
    });

    // Save the additional payment record
    await newAdditionalPayment.save();

    // Respond with the created additional payment record
    res.status(201).json({
      message: "Additional payment requested successfully.",
      additionalPayment: newAdditionalPayment
    });
  } catch (error) {
    next(error);
  }
};

export const adminSubmittedDoc = async (req, res) => {
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

    // Step 1: Validate if the court case exists
    const courtCase = await CourtCase.findById(caseId).session(session);
    if (!courtCase) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Court case not found." });
    }

    // Step 2: Upload files to S3 and get their URLs
    const documentUrls = [];
    for (const file of files) {
      const documentUrl = await uploadFileToS3(file, "CourtCaseDocs");
      documentUrls.push({ documentUrl });
    }

    // Step 3: Create an entry in CourtService_Document
    const newAdminDocument = await Document.create(
      [
        {
          courtServiceCase: caseId,
          documents: documentUrls,
          uploadedBy: "admin",
          documentType: "admin-upload",
          status: "submitted",
          uploadedAt: new Date(),
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "Admin document uploaded successfully.",
      document: newAdminDocument[0], 
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      message: "Failed to upload admin document.",
      error: error.message,
    });
  }
};

