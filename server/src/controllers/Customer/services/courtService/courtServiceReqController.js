import DocumentModel from "../../../../models/Customer/courtServiceModel/courtServiceDocument.js";
import AdditionalDocument from "../../../../models/Customer/courtServiceModel/courtServiceAdditionalDocuments.js";
import Payment from "../../../../models/Customer/courtServiceModel/courtServicePayment.js";
import AdditionalPayment from "../../../../models/Customer/courtServiceModel/courtServiceAdditionalPayment.js";
import { uploadFileToS3 } from "../../../../utils/s3Uploader.js";
import CourtCase from "../../../../models/Customer/courtServiceModel/courtServiceDetailsModel.js";
import Customer from "../../../../models/Customer/customerModels/customerModel.js";

export const uploadAdminRequestedDocument = async (req, res) => {
  try {
    const { caseId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded." });
    }

    const currentTime = new Date();
    const uploadedDocuments = [];

    // Upload the documents to S3 and gather the URLs
    for (const file of files) {
      try {
        const documentUrl = await uploadFileToS3(file, "courtcaseDocs");
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
    const courtCase = await CourtCase.findOne({ _id: caseId });
    if (!courtCase) {
      return res.status(404).json({ message: "Court case not found." });
    }

    // Get the customer details using the customerID from the courtCase
    const customer = await Customer.findById(courtCase.customerID);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    let existingDocument = await AdditionalDocument.findOne({ caseId: caseId });

    if (existingDocument) {
      existingDocument.documents = uploadedDocuments;
      existingDocument.requestStatus = "updated";
      existingDocument.requestUpdatedAt = currentTime;

      await existingDocument.save();

      const courtServiceID = existingDocument.courtServiceID;
      const serviceName = courtCase.serviceName;
      const customerName = customer.Name || "Unknown Customer";

      return res.status(200).json({
        message: "Documents uploaded and request status updated to 'updated'.",
        additionalDocument: existingDocument
      });
    } else {
      // Step 3: If no existing document is found, create a new entry with 'pending' status
      const newAdditionalDocument = new AdditionalDocument({
        caseId,
        courtServiceID,
        documents: [],
        requestReason: req.body.requestReason || "No reason provided",
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
    console.error("Error uploading documents:", error);
    res.status(500).json({
      message: "Error uploading documents.",
      error: error.message
    });
  }
};

export const getDocummentByCaseId = async (req, res, next) => {
  try {
    const { caseId } = req.params;

    console.log("Received caseId:", caseId);

    const documents = await DocumentModel.find({ courtServiceCase: caseId });

    console.log("documents", documents);

    if (!documents || documents.length === 0) {
      return res
        .status(404)
        .json({ message: "No documents found for the given case ID" });
    }

    res.status(200).json({
      message: "Documents retrieved successfully",
      documents
    });
  } catch (error) {
    next(error);
  }
};

export const submitAdditionalPayment = async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const { transactionId, paymentMethod, paymentDate, amount } = req.body;

    // Validate required fields
    if (!transactionId || !paymentMethod || !paymentDate || !amount) {
      return res.status(400).json({
        message:
          "All fields are required (transactionId, paymentMethod, paymentDate, amount)."
      });
    }

    // Find the additional payment record by caseId
    const payment = await AdditionalPayment.findOne({ caseId });
    if (!payment) {
      return res
        .status(404)
        .json({ message: "Additional payment record not found for the given case ID." });
    }

    // Check if the payment is already marked as paid
    if (payment.paymentStatus === "paid") {
      return res.status(400).json({
        message: "This additional payment has already been paid."
      });
    }

    // Validate the amount
    if (payment.amount !== amount) {
      return res.status(400).json({
        message: `Payment amount mismatch. Expected ${payment.amount}, but received ${amount}.`
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
    const courtCase = await CourtCase.findOne({ _id: caseId });
    if (!courtCase) {
      return res.status(404).json({ message: "Court case not found." });
    }

    const customer = await Customer.findById(courtCase.customerID);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    const courtServiceID = courtCase.courtServiceID;
    const serviceName = courtCase.serviceName;
    const customerName = customer.Name || "Unknown Customer";


    // Send response
    res.status(200).json({
      message: "Additional payment submitted successfully.",
      additionalDetails: {
        caseId,
        transactionId,
        paymentMethod,
        paymentDate,
        amount,
        paymentStatus: "paid"
      }
    });
  } catch (error) {
    next(error);
  }
};


export const getPaymentsByCaseId = async (req, res, next) => {
  try {
    const { caseId } = req.params;

    const payments = await Payment.find({ courtServiceCase: caseId });
    const additionalPayment = await AdditionalPayment.find({ caseId: caseId });

    console.log("payments", payments);
    console.log("additional Payments", additionalPayment);

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
