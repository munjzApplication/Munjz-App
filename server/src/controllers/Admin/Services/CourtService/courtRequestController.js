import Document from "../../../../models/Customer/courtServiceModel/courtServiceDocument.js";
import AdditionalPayment from "../../../../models/Customer/customerModels/additionalTransaction.js";
import CourtCase from "../../../../models/Customer/courtServiceModel/courtServiceDetailsModel.js";
import { uploadFileToS3 } from "../../../../utils/s3Uploader.js";
import { notificationService } from "../../../../service/sendPushNotification.js";
import mongoose from "mongoose";
import { io } from "../../../../socket/socketController.js";

export const requestDocument = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const { caseId } = req.params;
    const { reason } = req.body;

    const courtCase = await CourtCase.findById(caseId).session(session);
    if (!courtCase) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Court case not found." });
    }

    // Extract customerId from court case
    const customerId = courtCase.customerId;
    if (!customerId) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ message: "Customer ID is missing for this court case." });
    }
    const existingRequest = await Document.findOne({
      courtServiceCase: caseId,
      status: "pending"
    }).session(session);

    if (existingRequest) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ message: "A pending document request already exists." });
    }

    const documentRequest = await Document.create(
      [
        {
          courtServiceCase: caseId,
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

    // Notify Customer
    await notificationService.sendToCustomer(
      customerId,
      "New Document Request",
      `An admin has requested a document for your case: ${courtCase.courtServiceID}. Please upload the required document.`
    );

    // Emit Socket Event for Real-Time Update
    const customerNamespace = io.of("/customer");
    customerNamespace.to(customerId.toString()).emit("court-doc-request", {
      message: "New document request pending for your case.",
      documentRequest: documentRequest[0]
    });
    res.status(201).json({
      message: "Document request created successfully.",
      documentRequest: documentRequest[0]
    });
  } catch (error) {
    await session.abortTransaction();

    res.status(500).json({
      message: "Failed to create document request.",
      error: error.message
    });
  } finally {
    session.endSession();
  }
};
export const getReqDocumentDetails = async (req, res, next) => {
  try {
    const { caseId } = req.params;

    const courtCase = await CourtCase.findById(caseId);
    if (!courtCase) {
      return res.status(404).json({ message: "Court case not found." });
    }

    const requestedDocuments = await Document.find({
      courtServiceCase: caseId,
      uploadedBy: "admin",
      documentType: "admin-request",
      status: "pending"
    });

    if (!requestedDocuments.length) {
      return res
        .status(404)
        .json({ message: "No pending admin-requested documents found." });
    }

    res.status(200).json({
      message: "Pending admin-requested documents retrieved successfully.",
      requestedDocuments
    });
  } catch (error) {
    next(error);
  }
};

export const requestAdditionalPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { caseId } = req.params;
    const { amount, paidCurrency, requestReason, dueDate } = req.body;

    if (!amount || !paidCurrency || !requestReason || !dueDate) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({ message: "Invalid case ID." });
    }

    const courtCase = await CourtCase.findOne({ _id: caseId })
      .select("customerId")
      .lean();

    if (!courtCase) {
      return res.status(404).json({ message: "Court case not found." });
    }
    const customerId = courtCase.customerId;
    if (!customerId) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ message: "Customer ID is missing for this court case." });
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
      customerId: courtCase.customerId,
      caseId,
      caseType: "CourtService_Case",
      serviceType: "CourtService",
      amount,
      paidCurrency,
      requestReason,
      dueDate,
      status: "pending"
    });

    await notificationService.sendToCustomer(
      customerId,
      "New Payment Request",
      `An admin has requested an additional payment of ${amount} ${paidCurrency} for your case: ${courtCase.courtServiceID}. Please complete the payment before ${dueDate}.`
    );

    // Emit Socket Event for Real-Time Update
    const customerNamespace = io.of("/customer");
    customerNamespace.to(customerId.toString()).emit("court-payment-request", {
      message: `New payment request for your case: ${courtCase.courtServiceID}`,
      additionalPayment: newAdditionalPayment
    });

    res.status(201).json({
      message: "Additional payment requested successfully.",
      additionalPayment: newAdditionalPayment
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};
export const adminSubmittedDoc = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const { caseId } = req.params;
    const files = req.files;
    const { description } = req.body;

    if (!files || files.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: "No files uploaded." });
    }

    const courtCase = await CourtCase.findById(caseId).session(session);
    if (!courtCase) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Court case not found." });
    }
    const customerId = courtCase.customerId;
    if (!customerId) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ message: "Customer ID is missing for this court case." });
    }

    const documentUrls = [];
    for (const file of files) {
      const documentUrl = await uploadFileToS3(file, "CourtCaseDocs");
      documentUrls.push({ documentUrl });
    }

    const newAdminDocument = await Document.create(
      [
        {
          courtServiceCase: caseId,
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

    await session.commitTransaction();

    // ✅ Notify Customer
    await notificationService.sendToCustomer(
      customerId,
      "New Document Uploaded",
      `An admin has uploaded new documents for your case: ${courtCase.courtServiceID}. Please review them.`
    );

    // Emit Socket Event for Real-Time Update
    const customerNamespace = io.of("/customer");
    customerNamespace.to(customerId.toString()).emit("court-doc-uploaded", {
      message: "New documents uploaded for your case.",
      document: newAdminDocument[0]
    });

    res.status(201).json({
      message: "Admin document uploaded successfully.",
      document: newAdminDocument[0]
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};
