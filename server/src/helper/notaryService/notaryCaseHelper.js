import mongoose from "mongoose";
import NotaryCase from "../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import DocumentModel from "../../models/Customer/notaryServiceModel/notaryServiceDocument.js";
import Payment from "../../models/Customer/notaryServiceModel/notaryServicePayment.js";
import { uploadFileToS3 } from "../../utils/s3Uploader.js";
import { generateUniqueServiceID } from "../../helper/uniqueIDHelper.js";


/**
 * Save Notary Case Details
 */
export const saveNotaryCase = async (
  { customerId, serviceName, selectedServiceCountry, caseDescription, casePaymentStatus,status },
  session
) => {
  try {
    const notaryServiceID = await generateUniqueServiceID("notary");
console.log("notaryServiceID", notaryServiceID);

    const [notaryCase] = await NotaryCase.create(
      [
        {
          customerId,
          notaryServiceID,
          serviceName,
          selectedServiceCountry,
          caseDescription,
          casePaymentStatus,
          status
        },
      ],
      { session } // Ensure session is passed correctly
    );

    return { notaryCase, notaryServiceID };
  } catch (error) {
    console.error("Error saving Notary Case:", error);
    throw new Error("Failed to save Notary Case.");
  }
};

/**
 * Save Notary Documents
 */
export const saveNotaryDocuments = async (files, notaryCaseId, session) => {
  if (!files?.length) throw new Error("No files provided for document upload.");

  try {
    console.log("Uploading files to S3...");
    const documentUploads = await Promise.allSettled(
      files.map((file) => uploadFileToS3(file, "NotaryCaseDocs"))
    );

    const successfulUploads = documentUploads.filter(res => res.status === "fulfilled").map(res => res.value);
    const failedUploads = documentUploads.filter(res => res.status === "rejected");

    if (failedUploads.length > 0) {
      console.error("Some uploads failed:", failedUploads);
      throw new Error("Some document uploads failed");
    }

    console.log("Document Upload Success:", successfulUploads);

    const documentData = successfulUploads.map((url) => ({
      documentUrl: url,
      uploadedAt: new Date(),
    }));

    const [document] = await DocumentModel.create(
      [
        {
          notaryServiceCase: notaryCaseId,
          Documents: documentData,
          requestStatus: "unread",
        },
      ],
      { session }
    );

    console.log("Document Saved to DB:", document);
    return document;
  } catch (error) {
    console.error("Error saving Notary Documents:", error);
    throw new Error("Failed to save Notary Documents.");
  }
};


/**
 * Save Notary Payment
 */
export const saveNotaryPayment = async (
  { notaryCaseId, paymentAmount, paidCurrency, serviceName, selectedServiceCountry, paymentDate, customerName, customerId },
  session
) => {
  if (!paymentAmount || !paidCurrency) throw new Error("Missing required payment details.");

  try {
    const [payment] = await Payment.create(
      [
        {
          notaryServiceCase: notaryCaseId,
          amount: paymentAmount,
          paidCurrency,
          serviceName,
          serviceCountry: selectedServiceCountry,
          paymentDate: paymentDate || new Date(),
          paymentStatus: "paid",
        },
      ],
      { session }
    );

    return payment;
  } catch (error) {
    console.error("Error saving Notary Payment:", error);
    throw new Error("Failed to save Notary Payment.");
  }
};
