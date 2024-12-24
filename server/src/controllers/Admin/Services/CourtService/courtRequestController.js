import Document from "../../../../models/Customer/courtServiceModel/courtServiceDocument.js";
import AdditionalDocument from "../../../../models/Customer/courtServiceModel/courtServiceAdditionalDocuments.js";
import AdditionalPayment from "../../../../models/Customer/courtServiceModel/courtServiceAdditionalPayment.js";
import Payment from "../../../../models/Customer/courtServiceModel/courtServicePayment.js";
import { uploadFileToS3 } from "../../../../utils/s3Uploader.js";
import AdminUploadedDocument from "../../../../models/Admin/courtServiceModels/adminUploadedDocument.js";
import Customer from "../../../../models/Customer/customerModels/customerModel.js";
import CourtCase from "../../../../models/Customer/courtServiceModel/courtServiceDetailsModel.js";
import { sendNotificationToCustomer } from "../../../../helper/customer/notificationHelper.js";




export const requestDocument = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { reason } = req.body;

     
    const courtCase = await CourtCase.findOne({ _id: caseId });
    if (!courtCase) {
      return res.status(404).json({ message: "Court case not found." });
    }

    const customer = await Customer.findById(courtCase.customerID);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }
    const document = await Document.findOne({ courtServiceCase: caseId });

    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    if (document.requestStatus === "pending") {
      return res
        .status(400)
        .json({ message: "A document request is already pending." });
    }

    document.requestReason = reason;
    document.requestStatus = "pending";
    document.customerId = customer._id;
    document.requestUpdatedAt = new Date();

    await document.save();

    
    const additionalDocument = new AdditionalDocument({
      caseId,
      courtServiceID: document.courtServiceID,
      documents: [], 
      requestReason: reason,
      requestStatus: "pending",
      requestUpdatedAt: new Date()
    });

    await additionalDocument.save();

   
    await sendNotificationToCustomer(
      customer._id,
      `A document request has been made for Case ID: ${document.courtServiceID}.`,
      "Court Service Update",
      { 
        caseId, 
        courtServiceID: document.courtServiceID, 
        requestReason: reason,
        requestStatus: "pending" ,
        requestUpdatedAt: new Date()
      }
    );

    res.status(200).json({
      message: "Document request created successfully.",
      document,
      additionalDocument
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create document request.",
      error: error.message
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
    const notificationMessage = status === "approved" 
      ? `The document for Case ID: ${document.caseId} has been approved.` 
      : `The document for Case ID: ${document.caseId} has been rejected.`;

    
   
    await sendNotificationToCustomer(
      customer._id,
      notificationMessage,
      "Court Service Update",
      { documentId, caseId: document.caseId, status }
    );

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

    // Notify the customer about the additional payment request
    await sendNotificationToCustomer(
      customer._id,
      `An additional payment request has been made for Case ID: ${courtServiceID}.`,
      "Court Service Update",
      { 
        caseId,
        courtServiceID,
        serviceName,
        amount,
        dueDate,
        paymentStatus: "pending",
        requestedAt: new Date()
      }
    );

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
  try {
    const { caseId } = req.params;
    const { description } = req.body;
    const courtCase = await CourtCase.findOne({ _id: caseId });
    if (!courtCase) {
      return res.status(404).json({ message: "Court case not found." });
    }

    const customer = await Customer.findById(courtCase.customerID);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }
    if (!req.files || req.files.length === 0 || !description) {
      return res
        .status(400)
        .json({ message: "Files and description are required." });
    }

    const uploadedFiles = [];
    for (const file of req.files) {
      const documentUrl = await uploadFileToS3(file, "adminUploadedDocs");
      uploadedFiles.push(documentUrl);
    }

    const savedDocuments = await Promise.all(
      uploadedFiles.map(url =>
        new AdminUploadedDocument({
          caseId,
          documentUrl: url,
          description,
          uploadedAt: new Date()
        }).save()
      )
    );

    // Send notification to the customer instead of consultant
    await sendNotificationToCustomer(
      customer._id,
      `Admin has uploaded new documents for Case ID: ${caseId}.`,
      "Court Service Update",
      { caseId, uploadedFiles, description,uploadedAt: new Date() }
    );
    
    res.status(201).json({
      message: "Documents uploaded successfully.",
      uploadedDocuments: savedDocuments
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to upload documents.",
      error: error.message
    });
  }
};
