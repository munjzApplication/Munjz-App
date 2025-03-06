import Document from "../../../../models/Customer/notaryServiceModel/notaryServiceDocument.js";
import AdditionalDocument from "../../../../models/Customer/notaryServiceModel/notaryServiceAdditionalDocuments.js";
import AdditionalPayment from "../../../../models/Customer/notaryServiceModel/notaryServiceAdditionalPayment.js";
import Payment from "../../../../models/Customer/notaryServiceModel/notaryServicePayment.js";
import { uploadFileToS3 } from "../../../../utils/s3Uploader.js";
import AdminUploadedDocument from "../../../../models/Admin/notaryServiceModels/adminUploadedDocument.js";
import Customer from "../../../../models/Customer/customerModels/customerModel.js";
import NotaryCase from "../../../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";


export const requestDocument = async (req, res, next) => {


  try {
    const { caseId } = req.params;
    const { reason } = req.body;

    const notaryCase = await NotaryCase.findOne({ _id: caseId });
    if (!notaryCase) {
      return res.status(404).json({ message: "Court case not found." });
    }

    const customer = await Customer.findById(notaryCase.customerID);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }
    const document = await Document.findOne({ notaryServiceCase: caseId });

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
      notaryServiceCase: caseId,
      notaryServiceID: document.notaryServiceID,
      documents: [],
      requestReason: reason,
      requestStatus: "pending",
      requestUpdatedAt: new Date()
    });
    await additionalDocument.save();

    res.status(200).json({
      message: "Document request created successfully.",
      document,
      additionalDocument
    });
  } catch (error) {
    next(error);
  }
};

export const reviewDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const { status } = req.body;
    const notaryCase = await NotaryCase.findOne({ _id: caseId });
    if (!notaryCase) {
      return res.status(404).json({ message: "Court case not found." });
    }

    const customer = await Customer.findById(notaryCase.customerID);
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

    const notaryCase = await NotaryCase.findOne({ _id: caseId });
    if (!notaryCase) {
      return res.status(404).json({ message: "Notary case not found." });
    }

    const customer = await Customer.findById(notaryCase.customerID);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }
    const { amount, paidCurrency, requestReason, dueDate } = req.body;

    if (!amount || !paidCurrency || !requestReason || !dueDate) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const mainPayment = await Payment.findOne({ notaryServiceCase: caseId });


    // Determine courtServiceID and serviceName
    const notaryServiceID = mainPayment
      ? mainPayment.notaryServiceID
      : notaryCase.notaryServiceID;
    const serviceName = mainPayment
      ? mainPayment.serviceName
      : notaryCase.serviceName;

    const newAdditionalPayment = new AdditionalPayment({
      caseId,
      notaryServiceID,
      serviceName,
      amount,
      paidCurrency,
      requestReason,
      dueDate,
      status: "pending",
      requestedAt: new Date()
    });

    await newAdditionalPayment.save();

    res.status(201).json({
      message: "Additional payment requested successfully.",
      additionalPayment: newAdditionalPayment
    });
  } catch (error) {
    next(error);
  }
};

export const adminSubmittedDoc = async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const { description } = req.body;
    const notaryCase = await NotaryCase.findOne({ _id: caseId });
    if (!notaryCase) {
      return res.status(404).json({ message: "Court case not found." });
    }

    const customer = await Customer.findById(notaryCase.customerID);
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

    res.status(201).json({
      message: "Documents uploaded successfully.",
      uploadedDocuments: savedDocuments
    });
  } catch (error) {
    next(error);
  }
};
