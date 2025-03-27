import DocumentModel from "../../../../models/Customer/notaryServiceModel/notaryServiceDocument.js";
import Payment from "../../../../models/Customer/customerModels/transaction.js";
import AdditionalPayment from "../../../../models/Customer/customerModels/additionalTransaction.js";
import { uploadFileToS3 } from "../../../../utils/s3Uploader.js";
import NotaryCase from "../../../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
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

    const documentUrls = [];
    for (const file of files) {
      const documentUrl = await uploadFileToS3(file, "NotaryCaseDocs");
      documentUrls.push({ documentUrl });
    }

      const notaryCase = await NotaryCase.findById({_id:caseId}).select("notaryServiceID");
    
        if (!notaryCase) {
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({ message: "notaryCase not found." });
        }


    const newDocument = await DocumentModel.create(
      [
        {
          notaryServiceCase: caseId,
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

        // Notify Admin with customer email instead of caseId
        await notificationService.sendToAdmin(
          "Customer Uploaded Document",
          `Additional Document has been submitted for Case ID: ${notaryCase.notaryServiceID}.`
        );

    res.status(201).json({
      message: "Additional document uploaded successfully.",
     
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
export const uploadAdminRequestedDocument = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { caseId } = req.params;
    const { files } = req;

    if (!files || files.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "No files uploaded." });
    }

    const requestedDocument = await DocumentModel.findOne({

      notaryServiceCase: caseId,
      uploadedBy: "customer",
      documentType: "admin-request",
      status: "pending",

    }).session(session);


    if (!requestedDocument) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        message: "No pending admin-requested document found for this case.",
      });
    }

    const notaryCase = await NotaryCase.findById({_id:caseId}).select("notaryServiceID");
    
    if (!notaryCase) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "notaryCase not found." });
    }


    const documentUrls = [];
    for (const file of files) {
      const documentUrl = await uploadFileToS3(file, "NotaryCaseDocs");
      documentUrls.push({ documentUrl });
    }


    const updatedDocument = await DocumentModel.findByIdAndUpdate(
      requestedDocument._id,
      {
        $set: {
          documents: documentUrls,
          status: "submitted",
          fulfilledAt: new Date(),
        },
      },
      { new: true, session }
    );

    await session.commitTransaction();
    session.endSession();

    // Notify Admin with customer email instead of caseId
        await notificationService.sendToAdmin(
          "Admin Requested Document Submitted",
          `A requested document has been submitted for Case ID: ${notaryCase.notaryServiceID}.`
        );

    res.status(200).json({
      message: "Admin-requested document uploaded successfully.",
    
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

export const submitAdditionalPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { caseId } = req.params;
    const { amount, paidCurrency } = req.body;

    if (!amount || !paidCurrency) {
      return res.status(400).json({ message: "Amount and currency are required." });
    }

    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({ message: "Invalid case ID." });
    }


    const additionalPaymentData = await AdditionalPayment.findOne({ caseId, status: "pending" });

    if (!additionalPaymentData) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "No pending additional payment request found for this case." });
    }


    if (additionalPaymentData.amount !== amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "The payment amount does not match the requested amount." });
    }

    const notaryCase = await NotaryCase.findById({_id:caseId}).select("notaryServiceID");
    
    if (!notaryCase) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "notaryCase not found." });
    }



    const additionalPayment = await AdditionalPayment.findOneAndUpdate(
      { caseId, status: "pending" },
      {
        $set: {
          amount,
          paidCurrency,
          status: "completed",
          paymentDate: new Date()
        }
      },
      { new: true, session }
    );

    if (!additionalPayment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "No pending additional payment request found for this case." });
    }

    // Update totalAmount in NotaryCase
    const updatedNotaryCase = await NotaryCase.findOneAndUpdate(
      { _id: caseId },
      { $inc: { totalAmountPaid: amount } },
      { new: true, session }
    );

    if (!updatedNotaryCase) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Notary case not found." });
    }

    await session.commitTransaction();
    session.endSession();

    // Notify Admin with customer email instead of caseId
        await notificationService.sendToAdmin(
          "Admin Requested Payment Submitted",
          `A requested payment has been completed for Case ID: ${notaryCase.notaryServiceID}.`
        );

    res.status(200).json({
      message: "Additional payment submitted successfully.",

    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const getDocummentByCaseId = async (req, res, next) => {
  try {
    const { caseId } = req.params;

    const documents = await DocumentModel.find({ notaryServiceCase: caseId });

    if (!documents || documents.length === 0) {
      return res
        .status(404)
        .json({ message: "No documents found for the given case ID" });
    }

    res.status(200).json({
      message: "documents retrieved successfully",
      documents
    });
  } catch (error) {
    next(error);
  }
};


export const getPaymentsByCaseId = async (req, res, next) => {
  try {
    const { caseId } = req.params;

    const payments = await Payment.find({ caseId: caseId });
    const additionalPayment = await AdditionalPayment.find({ caseId: caseId });


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
