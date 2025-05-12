import Document from "../../../../models/Customer/notaryServiceModel/notaryServiceDocument.js";
import AdditionalPayment from "../../../../models/Customer/customerModels/additionalTransaction.js";
import { uploadFileToS3 } from "../../../../utils/s3Uploader.js";
import NotaryCase from "../../../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import mongoose from "mongoose";
import { notificationService } from "../../../../service/sendPushNotification.js";
import emitAdminRequest from "../../../../socket/emitAdminRequest.js";
import { formatDate } from "../../../../helper/dateFormatter.js";

export const requestDocument = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { caseId } = req.params;
    const { reason } = req.body;

    const notaryCase = await NotaryCase.findById(caseId).session(session);
    if (!notaryCase) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Notary case not found." });
    }

    const existingRequest = await Document.findOne({
      notaryServiceCase: caseId,
      status: "pending",
    }).session(session);

    // Extract customerId from Notary case
    const customerId = notaryCase.customerId;
    if (!customerId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Customer ID is missing for this Notary case." });
    }
    if (existingRequest) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "A pending document request already exists." });
    }

    const documentRequest = await Document.create(
      [
        {
          notaryServiceCase: caseId,
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

    // Notify Customer
    await notificationService.sendToCustomer(
      customerId,
      "New Document Request",
      `An admin has requested a document for your case: ${notaryCase.notaryServiceID}. Please upload the required document.`,

    );

    // Emit real-time update to customer
    const doc = documentRequest[0]; // 👈 get the actual document object

    emitAdminRequest("notary-admin-request", customerId, {
      message: `New document request pending for your case: ${notaryCase.notaryServiceID}`,
      notifications: {
        _id: doc._id,
        courtServiceCase : doc.notaryServiceCase,
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
      documentRequest: documentRequest[0],
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
    const { amount, paidCurrency, requestReason, dueDate } = req.body;

    if (!amount || !paidCurrency || !requestReason || !dueDate) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({ message: "Invalid case ID." });
    }

    const notaryCase = await NotaryCase.findOne({ _id: caseId })
      .select("customerId")
      .lean();
    if (!notaryCase) {
      return res.status(404).json({ message: "Notary case not found." });
    }

    const customerId = notaryCase.customerId;
    if (!customerId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Customer ID is missing for this notary case." });
    }

    const pendingRequestExists = await AdditionalPayment.exists({ caseId, status: "pending" });

    if (pendingRequestExists) {
      return res.status(400).json({
        message: "An additional payment request is already pending for this case. Please wait until it's resolved.",
      });
    }


    const newAdditionalPayment = await AdditionalPayment.create({
      customerId: notaryCase.customerId,
      caseId,
      caseType: "NotaryService_Case",
      serviceType: "NotaryService",
      amount,
      paidCurrency,
      requestReason,
      dueDate,
      status: "pending",
    });


    await notificationService.sendToCustomer(
      customerId,
      "New Payment Request",
      `An admin has requested an additional payment of ${amount} ${paidCurrency} for your case: ${notaryCase.notaryServiceID}. Please complete the payment before ${dueDate}.`
    );

    // Emit real-time update to customer
    emitAdminRequest("notary-admin-request", customerId, {
      message: `New payment request for your case: ${notaryCase.notaryServiceID}`,
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

    res.status(201).json({
      message: "Additional payment requested successfully.",
      additionalPayment: newAdditionalPayment,
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


    const notaryCase = await NotaryCase.findById(caseId).session(session);
    if (!notaryCase) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Notary case not found." });
    }

    const customerId = notaryCase.customerId;
    if (!customerId) {
      await session.abortTransaction();
      session.endSession();

      await notificationService.sendToCustomer(
        customerId,
        "New Document Uploaded",
        `An admin has uploaded new documents for your case: ${notaryCase.notaryServiceID}. Please review them.`,
      );
      return res.status(400).json({ message: "Customer ID is missing for this notary case." });
    }

    const documentUrls = [];
    for (const file of files) {
      const documentUrl = await uploadFileToS3(file, "NotaryCaseDocs");
      documentUrls.push({ documentUrl });
    }


    const newAdminDocument = await Document.create(
      [
        {
          notaryServiceCase: caseId,
          documents: documentUrls,
          description,
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

    // Emit real-time update to customer
    emitAdminRequest("notary-admin-request", customerId, {
      message: "New documents uploaded for your case.",
      notifications: {
        _id: newAdminDocument[0]._id,
        courtServiceCase : newAdminDocument[0].notaryServiceCase,
        uploadedBy: newAdminDocument[0].uploadedBy,
        documentType: newAdminDocument[0].documentType,
        status: newAdminDocument[0].status,
        requestedAt: newAdminDocument[0].requestedAt,
        requestReason: newAdminDocument[0].requestReason,
        documents: newAdminDocument[0].documents,
        uploadedAt: formatDate(newAdminDocument[0].uploadedAt),
        createdAt: formatDate(newAdminDocument[0].createdAt)
      }
    });

    res.status(201).json({
      message: "Admin document uploaded successfully.",
      document: newAdminDocument[0],
    });
  } catch (error) {
    next(error);
  }
};
