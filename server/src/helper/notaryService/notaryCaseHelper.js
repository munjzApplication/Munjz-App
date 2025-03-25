import mongoose from "mongoose";
import NotaryCase from "../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import DocumentModel from "../../models/Customer/notaryServiceModel/notaryServiceDocument.js";
import Payment from "../../models/Customer/customerModels/transaction.js";
import { uploadFileToS3 } from "../../utils/s3Uploader.js";
import { generateUniqueServiceID } from "../../helper/uniqueIDHelper.js";


/**
 * Save Notary Case Details
 */
export const saveNotaryCase = async (
  { customerId, serviceName, selectedServiceCountry, caseDescription, casePaymentStatus,status,paymentAmount,paidCurrency },
  session
) => {
  try {
    const notaryServiceID = await generateUniqueServiceID("notary");


    const [notaryCase] = await NotaryCase.create(
      [
        {
          customerId,
          notaryServiceID,
          serviceName,
          selectedServiceCountry,
          caseDescription,
          casePaymentStatus,
          status,
          totalAmountPaid: paymentAmount,
          paidCurrency
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
     const documentUploads = await Promise.all(files.map(file => uploadFileToS3(file, "NotaryCaseDocs")));
 
     // Prepare document data array
     const documentData = documentUploads.map(url => ({
       documentUrl: url
     }));
 
     // Create a new document entry
     const document = await DocumentModel.create(
       [{
        notaryServiceCase: notaryCaseId,
         documents: documentData,  // Store all documents inside the array
         uploadedBy: "customer",
         documentType: "initial",
         status: "submitted",
         uploadedAt: new Date()
       }],
       { session }
     );
 
     return document;
   } catch (error) {
     console.error("Error saving Court Documents:", error);
     throw new Error("Failed to save Court Documents.");
   }
 };

/**
 * Save Notary Payment
 */
export const saveNotaryPayment = async (
  { customerId,notaryCaseId, paymentAmount, paidCurrency, paymentDate },
  session
) => {
  if (!paymentAmount || !paidCurrency) throw new Error("Missing required payment details.");

  try {
    const [payment] = await Payment.create(
      [
        {
          customerId,
          caseId: notaryCaseId,
          caseType: "NotaryService_Case",
          serviceType:"NotaryService",
          amountPaid: paymentAmount,
          currency:paidCurrency,
          paymentDate: paymentDate || new Date(),
          status: "paid" 
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
