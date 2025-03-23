import Document from "../../../../models/Customer/translationModel/translationDocument.js";
import AdditionalPayment from "../../../../models/Customer/customerModels/additionalTransaction.js";
import TranslationCase from "../../../../models/Customer/translationModel/translationDetails.js";
import { uploadFileToS3 } from "../../../../utils/s3Uploader.js";
import mongoose from "mongoose";

export const requestDocuments = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { caseId } = req.params;
    const { reason } = req.body;

    const translationCase = await TranslationCase.findById(caseId).session(session);
    if (!translationCase) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Translation case not found." });
    }
    const existingRequest = await Document.findOne({
      translationCase: caseId,
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
          translationCase: caseId,
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


  const pendingRequestExists = await AdditionalPayment.exists({ caseId, status: "pending" });

    if (pendingRequestExists) {
      return res.status(400).json({
        message: "An additional payment request is already pending for this case. Please wait until it's resolved.",
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


    const translationCase = await TranslationCase.findById(caseId).session(session);
    if (!translationCase) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "translation case not found." });
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
