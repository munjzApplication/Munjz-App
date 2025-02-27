import TranslationCase from "../../models/Customer/translationModel/translationDetails.js";
import TranslationDocument from "../../models/Customer/translationModel/translationDocument.js";
import TranslationPayment from "../../models/Customer/translationModel/translationPayment.js";
import { uploadFileToS3 } from "../../utils/s3Uploader.js";
import { generateUniqueServiceID } from "../../helper/uniqueIDHelper.js";
import Notification from "../../models/Admin/notificationModels/notificationModel.js";

/**
 * Save Translation Case Details
 */
export const saveTranslationCase = async ({
  customerId,
  documentLanguage,
  translationLanguage,
  PaymentStatus,
  submissionDate,
  status,
  session
}) => {
  try {
    const translationServiceID = await generateUniqueServiceID("translation");

    const [translationCase] = await TranslationCase.create(
      [
        {
          customerId,
          translationServiceID,
          documentLanguage,
          translationLanguage,
          PaymentStatus,
          submissionDate,
          status
        }
      ],
      { session }
    );

    return { translationCase, translationServiceID };
  } catch (error) {
    console.error("Error saving Translation Case:", error);
    throw new Error("Failed to save Translation Case.");
  }
};

/**
 * Save Translation Documents
 */
export const saveTranslationDocuments = async (
  files,
  translationCaseId,
  noOfPage,
  session
) => {
  console.log("Received files:", files);
  console.log("Translation Case ID:", translationCaseId);
  console.log("Received noOfPage:", noOfPage);

  if (!files?.length) throw new Error("No files provided for document upload.");

  try {
    const documentUploads = await Promise.all(
      files.map(file => uploadFileToS3(file, "TranslationDocuments"))
    );

    const documentData = documentUploads.map(url => ({
      documentUrl: url, 
      uploadedAt: new Date()
    }));

    const document = await TranslationDocument.create(
      [
        { 
          translationCase: translationCaseId, 
          Documents: documentData, 
          requestStatus: "unread",
          noOfPage,
          submissionDate: new Date()
        }
      ],
      { session }
    );

    return document;
  } catch (error) {
    console.error("Error saving Translation Documents:", error.message);
    throw new Error(`Failed to save Translation Documents: ${error.message}`);
  }
};

/**
 * Save Translation Payment
 */
export const saveTranslationPayment = async ({
  translationCaseId,
  paymentAmount,
  paidCurrency,
  customerName,
  session
}) => {
  try {
    // If no payment is provided, return unpaid status
    if (!paymentAmount || !paidCurrency) {
      console.log("No payment provided, marking case as unpaid.");
      return null; 
    }

    // Save payment details
    const translationPayment = await TranslationPayment.create(
      [
        {
          translationCase: translationCaseId,
          amount: paymentAmount,
          paidCurrency,
          paymentDate: new Date(),
          paymentStatus: "paid"
        }
      ],
      { session }
    );

    // Create payment success notification
    await Notification.create(
      [
        {
          notificationDetails: {
            type: "Payment",
            title: "Translation Service Payment Successfully Processed",
            message: `Your payment of ${paymentAmount} ${paidCurrency} has been successfully processed.`,
            additionalDetails: {
              customerName,
              paymentStatus: "paid"
            }
          },
          status: "unread",
          createdAt: new Date()
        }
      ],
      { session }
    );

    return translationPayment;
  } catch (error) {
    console.error("Error saving Translation Payment:", error);
    throw new Error("Failed to save Translation Payment.");
  }
};
