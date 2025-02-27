import CourtCase from "../../models/Customer/courtServiceModel/courtServiceDetailsModel.js";
import DocumentModel from "../../models/Customer/courtServiceModel/courtServiceDocument.js";
import Payment from "../../models/Customer/courtServiceModel/courtServicePayment.js";
import { uploadFileToS3 } from "../../utils/s3Uploader.js";
import { generateUniqueServiceID } from "../../helper/uniqueIDHelper.js";
import Notification from "../../models/Admin/notificationModels/notificationModel.js";
import mongoose from "mongoose";

/**
 * Save Court Case Details
 */
export const saveCourtCase = async ({ customerId, serviceName, selectedServiceCountry, caseDescription, casePaymentStatus, status }, session) => {
  try {
    const courtServiceID = await generateUniqueServiceID("court");
    console.log("Court Service ID:", courtServiceID);
    

    const courtCase = await CourtCase.create([{ customerId, courtServiceID, serviceName, selectedServiceCountry, caseDescription, casePaymentStatus, status }], { session });

    return { courtCase: courtCase[0], courtServiceID };
  } catch (error) {
    console.error("Error saving Court Case:", error);
    throw new Error("Failed to save Court Case.");
  }
};

/**
 * Save Court Documents
 */
export const saveCourtDocuments = async (
  files, 
  courtCaseId, 
  session
) => {
  if (!files?.length) throw new Error("No files provided for document upload.");

  try {
    const documentUploads = await Promise.all(files.map(file => uploadFileToS3(file, "CourtCaseDocs")));

    const documentData = documentUploads.map(url => ({ documentUrl: url, uploadedAt: new Date() }));

    const document = await DocumentModel.create(
      [
        {
          courtServiceCase: courtCaseId,
          Documents: documentData, 
          requestStatus: "unread" 
        }
      ],
       { session }
      );

    return document;
  } catch (error) {
    console.error("Error saving Court Documents:", error);
    throw new Error("Failed to save Court Documents.");
  }
};

/**
 * Save Court Payment
 */
export const saveCourtPayment = async ({ courtCaseId, paymentAmount, paidCurrency, serviceName, selectedServiceCountry, paymentDate, customerName, session }) => {
  if (!paymentAmount || !paidCurrency) throw new Error("Missing required payment details.");

  try {
    const payment = await Payment.create([{ courtServiceCase: courtCaseId, amount: paymentAmount, paidCurrency, serviceName, serviceCountry: selectedServiceCountry, paymentDate: paymentDate || new Date(), paymentStatus: "paid" }], { session });

    // Send Notification
    await Notification.create([
      {
        notificationDetails: {
          type: "Case Registration",
          title: "Court Service Registered With Payment",
          message: `A payment of ${paymentAmount} ${paidCurrency} for your court service has been successfully completed.`,
          additionalDetails: { customerName, serviceName, country: selectedServiceCountry, paymentStatus: "paid" }
        },
        status: "unread",
        createdAt: new Date()
      }
    ], { session });

    return payment;
  } catch (error) {
    console.error("Error saving Court Payment:", error);
    throw new Error("Failed to save Court Payment.");
  }
};
