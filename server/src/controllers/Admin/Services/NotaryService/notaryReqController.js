import Document from "../../../../models/Customer/notaryServiceModel/notaryServiceDocument.js";
import AdditionalPayment from "../../../../models/Customer/customerModels/additionalTransaction.js";
import { uploadFileToS3 } from "../../../../utils/s3Uploader.js";
import NotaryCase from "../../../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import mongoose from "mongoose";

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

    res.status(201).json({
      message: "Admin document uploaded successfully.",
      document: newAdminDocument[0],
    });
  } catch (error) {
    next(error);
  }
};
