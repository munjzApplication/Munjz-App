import Document from "../../../../models/Customer/translationModel/translationDocument.js";
import AdditionalPayment from "../../../../models/Customer/customerModels/additionalTransaction.js";
import TranslationCase from "../../../../models/Customer/translationModel/translationDetails.js";
import { uploadFileToS3 } from "../../../../utils/s3Uploader.js";
import mongoose from "mongoose";
import { notificationService } from "../../../../service/sendPushNotification.js";
import {emitAdminRequest} from "../../../../socket/emitAdminRequest.js";
import { emitAdminPaymentRequest } from "../../../../socket/emitAdminRequest.js";
import { formatDate } from "../../../../helper/dateFormatter.js";

export const requestDocuments = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { caseId } = req.params;
    const { reason } = req.body;

    const translationCase = await TranslationCase.findById(caseId).session(
      session
    );
    if (!translationCase) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Translation case not found." });
    }

    // Extract customerId from translation case
    const customerId = translationCase.customerId;
    if (!customerId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "Customer ID is missing for this translation case."
      });
    }

    const existingRequest = await Document.findOne({
      translationCase: caseId,
      status: "pending"
    }).session(session);

    if (existingRequest) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "A pending document request already exists."
      });
    }

    const [documentRequest] = await Document.create(
      [
        {
          translationCase: caseId,
          uploadedBy: "admin",
          documentType: "admin-request",
          status: "pending",
          requestedAt: new Date(),
          requestReason: reason
        }
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // ✅ Notify Customer
    await notificationService.sendToCustomer(
      customerId,
      "New Document Request",
      `An admin has requested a document for your case: ${translationCase.translationServiceID}. Please upload the required document.`
    );

    // Emit real-time update to customer
    const doc = documentRequest;


    emitAdminRequest("translation-admin-request", customerId, {
      message: `New document request pending for your case: ${translationCase.translationServiceID}`,
      notifications: {
        _id: doc._id,
        courtServiceCase: doc.translationCase,
        uploadedBy: doc.uploadedBy,
        documentType: doc.documentType,
        status: doc.status,
        requestedAt: formatDate(doc.requestedAt),
        requestReason: doc.requestReason,
        documents: doc.documents,
        uploadedAt: formatDate(doc.uploadedAt),
        createdAt: formatDate(doc.createdAt)
      }
    });

    res.status(201).json({
      message: "Document request created successfully.",
      documentRequest
    });
  } catch (error) {
    // ✅ Only abort if session is still active
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    res.status(500).json({
      message: "Failed to create document request.",
      error: error.message
    });
  }
};

export const requestAdditionalPayment = async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const { amount, paidCurrency, requestReason, dueDate } = req.body;

    if (!amount || !paidCurrency || !requestReason || !dueDate) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({ message: "Invalid case ID." });
    }

    const translationCase = await TranslationCase.findOne({ _id: caseId })
      .select("customerId")
      .lean();

    if (!translationCase) {
      return res.status(404).json({ message: "Translation case not found." });
    }
    const customerId = translationCase.customerId;
    if (!customerId) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ message: "Customer ID is missing for this translation case." });
    }

    const pendingRequestExists = await AdditionalPayment.exists({
      caseId,
      status: "pending"
    });

    if (pendingRequestExists) {
      return res.status(400).json({
        message:
          "An additional payment request is already pending for this case. Please wait until it's resolved."
      });
    }

    const newAdditionalPayment = await AdditionalPayment.create({
      customerId: translationCase.customerId,
      caseId,
      caseType: "Translation_Case",
      serviceType: "Translation",
      amount,
      paidCurrency,
      requestReason,
      dueDate,
      status: "pending"
    });

    await notificationService.sendToCustomer(
      customerId,
      "New Payment Request",
      `An admin has requested an additional payment of ${amount} ${paidCurrency} for your case: ${translationCase.translationServiceID}. Please complete the payment before ${dueDate}.`
    );

    // Emit real-time update to customer
    emitAdminRequest("translation-admin-request", customerId, {
      message: `New payment request for your case: ${translationCase.translationServiceID}`,
      notifications: {
        _id: newAdditionalPayment._id,
        customerId: newAdditionalPayment.customerId,
        caseId: newAdditionalPayment.caseId,
        caseType: newAdditionalPayment.caseType,
        serviceType: newAdditionalPayment.serviceType,
        amount: newAdditionalPayment.amount,
        paidCurrency: newAdditionalPayment.paidCurrency,
        requestReason: newAdditionalPayment.requestReason,
        dueDate: newAdditionalPayment.dueDate,
        status: newAdditionalPayment.status,
        requestedAt: formatDate(newAdditionalPayment.requestedAt),
        paymentDate: formatDate(newAdditionalPayment.paymentDate),
        createdAt: formatDate(newAdditionalPayment.createdAt),
        updatedAt: formatDate(newAdditionalPayment.updatedAt)
      }
    });

    emitAdminPaymentRequest("translation-payment-request", newAdditionalPayment);

    res.status(201).json({
      message: "Additional payment requested successfully.",
      additionalPayment: newAdditionalPayment
    });
  } catch (error) {
    next(error);
  }
};

export const adminSubmittedDoc = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { caseId } = req.params;
    const files = req.files;
    const { description } = req.body;

    if (!files || files.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "No files uploaded." });
    }

    const translationCase = await TranslationCase.findById(caseId).session(
      session
    );
    if (!translationCase) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "translation case not found." });
    }

    const customerId = translationCase.customerId;
    if (!customerId) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ message: "Customer ID is missing for this translation case." });
    }

    const documentUrls = [];
    for (const file of files) {
      const documentUrl = await uploadFileToS3(file, "TranslationCaseDocs");
      documentUrls.push({ documentUrl });
    }

    const newAdminDocument = await Document.create(
      [
        {
          translationCase: caseId,
          documents: documentUrls,
          description,
          uploadedBy: "admin",
          documentType: "admin-upload",
          status: "submitted",
          uploadedAt: new Date()
        }
      ],
      { session }
    );

    if (!newAdminDocument || newAdminDocument.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({ message: "Failed to save admin document." });
    }

    await session.commitTransaction();
    session.endSession();

    const doc = newAdminDocument[0];

    await notificationService.sendToCustomer(
      customerId,
      "New Document Uploaded",
      `An admin has uploaded new documents for your case: ${translationCase.translationServiceID}. Please review them.`
    );

    // Emit real-time update to customer
    emitAdminRequest("translation-admin-request", customerId, {
      message: "New documents uploaded for your case.",
      notifications: {
        _id: doc._id,
        courtServiceCase: doc.translationCase,
        uploadedBy: doc.uploadedBy,
        documentType: doc.documentType,
        status: doc.status,
        requestedAt: formatDate(doc.requestedAt?? new Date()),
        requestReason: doc.requestReason,
        documents: doc.documents,
        uploadedAt: formatDate(doc.uploadedAt ?? new Date()),
        createdAt: formatDate(doc.createdAt ?? new Date())
      }
    });

    res.status(201).json({
      message: "Admin document uploaded successfully.",
      document: newAdminDocument[0]
    });
  } catch (error) {
    next(error);
  }
};
