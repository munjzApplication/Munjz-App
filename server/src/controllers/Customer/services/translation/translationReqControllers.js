import DocumentModel from "../../../../models/Customer/translationModel/translationDocument.js";
import AdditionalDocument from "../../../../models/Customer/translationModel/translationAdditionalDocuments.js";
import Payment from "../../../../models/Customer/translationModel/translationPayment.js";
import AdditionalPayment from "../../../../models/Customer/translationModel/translationAdditionalPayments.js";
import { uploadFileToS3 } from "../../../../utils/s3Uploader.js";
import TranslationCase from "../../../../models/Customer/translationModel/translationDetails.js";
import Customer from "../../../../models/Customer/customerModels/customerModel.js";
export const uploadAdminReqDocuments = async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const { files } = req;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded." });
    }

    const currentTime = new Date();
    const uploadedDocuments = [];

    // Upload the documents to S3 and gather the URLs
    for (const file of files) {
      try {
        const documentUrl = await uploadFileToS3(file, "translationCaseDocs");
        uploadedDocuments.push({
          documentUrl,
          uploadedAt: currentTime
        });
      } catch (uploadError) {
        console.error("Error uploading file:", uploadError);
        return res.status(500).json({
          message: `Error uploading file: ${file.originalname}`,
          error: uploadError.message
        });
      }
    }
    // Find the CourtCase by caseId (or courtServiceID)
    const translationCase = await TranslationCase.findOne({ _id: caseId });
    if (!translationCase) {
      return res.status(404).json({ message: "translation case not found." });
    }

    // Get the customer details using the customerID from the courtCase
    const customer = await Customer.findById(translationCase.customerID);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }
    let existingDocument = await AdditionalDocument.findOne({
      translationCase: caseId
    });

    if (existingDocument) {
      existingDocument.documents = uploadedDocuments;
      existingDocument.requestStatus = "updated";
      existingDocument.requestUpdatedAt = currentTime;

      await existingDocument.save();
      const translationServiceID = existingDocument.translationServiceID;
      const serviceName = translationCase.serviceName;
      const customerName = customer.Name || "Unknown Customer";

      return res.status(200).json({
        message: "Documents uploaded and request status updated to 'updated'.",
        additionalDocument: existingDocument
      });
    } else {
      // Step 3: If no existing document is found, create a new entry with 'pending' status
      const newAdditionalDocument = new AdditionalDocument({
        translationCase: caseId,
        translationServiceID,
        documents: [],
        requestReason: requestReason || "No reason provided",
        requestStatus: "pending",
        requestUpdatedAt: currentTime
      });

      await newAdditionalDocument.save();

      return res.status(201).json({
        message:
          "Document entry created with 'pending' status. Please wait for customer upload.",
        additionalDocument: newAdditionalDocument
      });
    }
  } catch (error) {
    next(error);
  }
};

export const submitAdditionalPayment = async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const { transactionId, paymentMethod, paymentDate } = req.body;

    if (!transactionId || !paymentMethod || !paymentDate) {
      return res.status(400).json({
        message:
          "All fields are required (transactionId, paymentMethod, paymentDate)."
      });
    }

    // Find the additional payment record by caseId
    const payment = await AdditionalPayment.findOne({
      TranslationcaseId: caseId
    });
    if (!payment) {
      return res
        .status(404)
        .json({
          message: "Additional payment record not found for the given case ID."
        });
    }

    if (payment.paymentStatus === "paid") {
      return res.status(400).json({
        message: "This additional payment has already been paid."
      });
    }

    // Update the payment status to 'paid'
    const updatedPayment = await AdditionalPayment.updateOne(
      { _id: payment._id },
      {
        $set: {
          transactionId: transactionId,
          paymentMethod: paymentMethod,
          paymentDate: paymentDate,
          paymentStatus: "paid",
          paidAt: new Date()
        }
      }
    );

    if (updatedPayment.modifiedCount === 0) {
      return res
        .status(500)
        .json({ message: "Failed to update payment status." });
    }

    // Get Court Case and Customer details for the notification
    const translationCase = await TranslationCase.findOne({ _id: caseId });
    if (!translationCase) {
      return res.status(404).json({ message: "translation case not found." });
    }

    const customer = await Customer.findById(translationCase.customerID);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    const translationServiceID = translationCase.translationServiceID;
    const serviceName = translationCase.serviceName;
    const customerName = customer.Name || "Unknown Customer";

    res.status(200).json({
      message: "Additional payment submitted successfully.",
      additionalDetails: payment
    });
  } catch (error) {
    next(error);
  }
};
