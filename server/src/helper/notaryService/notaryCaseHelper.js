import mongoose from "mongoose";
import NotaryCase from "../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import DocumentModel from "../../models/Customer/notaryServiceModel/notaryServiceDocument.js";
import Payment from "../../models/Customer/notaryServiceModel/notaryServicePayment.js";
import { uploadFileToS3 } from "../../utils/s3Uploader.js";
import { generateUniqueServiceID } from "../../helper/uniqueIDHelper.js";
import Notification from "../../models/Admin/notificationModels/notificationModel.js";

/**
 * Save Notary Case Details
 */
export const saveNotaryCase = async ({
  customerId,
  serviceName, 
  selectedServiceCountry, 
  caseDescription, 
  casePaymentStatus
}) => {
  try {
    const notaryServiceID = await generateUniqueServiceID("notary");

    const notaryCase = await NotaryCase.create({
      customerId,
      notaryServiceID,
      serviceName,
      selectedServiceCountry,
      caseDescription,
      casePaymentStatus
    });

    return { notaryCase, notaryServiceID };
  } catch (error) {
    console.error("Error saving Notary Case:", error);
    throw new Error("Failed to save Notary Case.");
  }
};

/**
 * Save Notary Documents
 */
export const saveNotaryDocuments = async (files, notaryServiceID, notaryCaseId) => {
  if (!files?.length) throw new Error("No files provided for document upload.");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Upload files to S3
    const documentUploads = await Promise.all(
      files.map(file => uploadFileToS3(file, "NotaryCaseDocs"))
    );

    const documentData = documentUploads.map(url => ({
      documentUrl: url,
      uploadedAt: new Date(),
    }));

    const document = await DocumentModel.create(
      [{
        notaryServiceCase: notaryCaseId,
        notaryServiceID,
        Documents: documentData,
        requestStatus: "unread",
      }],
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    
    return document;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error saving Notary Documents:", error);
    throw new Error("Failed to save Notary Documents.");
  }
};

/**
 * Save Notary Payment
 */
export const saveNotaryPayment = async ({
  notaryServiceID,
  notaryCaseId,
  paymentAmount,
  paidCurrency,
  serviceName,
  selectedServiceCountry,
  paymentDate,
  customerName
}) => {
  if (!paymentAmount || !paidCurrency) throw new Error("Missing required payment details.");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Save Payment
    const payment = await Payment.create(
      [{
        notaryServiceCase: notaryCaseId,
        notaryServiceID,
        amount: paymentAmount,
        paidCurrency,
        serviceName,
        serviceCountry: selectedServiceCountry,
        paymentDate: paymentDate || new Date(),
        paymentStatus: "paid"
      }],
      { session }
    );

    // Create Notification
    await Notification.create(
      [{
        notificationDetails: {
          type: "Payment",
          title: "Notary Service Payment Successfully Processed",
          message: `A payment of ${paymentAmount} ${paidCurrency} for your notary service has been successfully completed.`,
          additionalDetails: {
            customerName,
            serviceName,
            country: selectedServiceCountry,
            paymentStatus: "paid"
          }
        }
      }],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return payment;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error saving Notary Payment:", error);
    throw new Error("Failed to save Notary Payment.");
  }
};
