import Document from "../../../../models/Customer/courtServiceModel/courtServiceDocument.js";
import AdditionalPayment from "../../../../models/Customer/customerModels/additionalTransaction.js";
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
    const existingRequest = await Document.findOne({
      courtServiceCase: caseId,
      status: "pending",
    }).session(session);

    if (existingRequest) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "A pending document request already exists." });
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
export const getReqDocumentDetails = async (req, res, next) => {
  try {
    const { caseId } = req.params;

    // Step 1: Validate if the case exists
    const courtCase = await CourtCase.findById(caseId);
    if (!courtCase) {
      return res.status(404).json({ message: "Court case not found." });
    }

    // Step 2: Fetch only pending admin-requested documents
    const requestedDocuments = await Document.find({
      courtServiceCase: caseId,
      uploadedBy: "admin",
      documentType: "admin-request",
      status: "pending", // Only fetch pending requests
    });

    if (!requestedDocuments.length) {
      return res.status(404).json({ message: "No pending admin-requested documents found." });
    }

    res.status(200).json({
      message: "Pending admin-requested documents retrieved successfully.",
      requestedDocuments,
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


    const courtCase = await CourtCase.findOne({ _id: caseId })
      .select("customerId")
      .lean();

    if (!courtCase) {
      return res.status(404).json({ message: "Court case not found." });
    }


    const pendingRequestExists = await AdditionalPayment.exists({ caseId, status: "pending" });

    if (pendingRequestExists) {
      return res.status(400).json({
        message: "An additional payment request is already pending for this case. Please wait until it's resolved.",
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

