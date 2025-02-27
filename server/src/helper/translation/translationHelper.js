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
  casePaymentStatus,
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
          casePaymentStatus,
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
 * Save Court Documents
 */
export const saveTranslationDocuments = async (
  files,
  translationCaseId,
  noOfPage,
  session
) => {
    console.log("Received files:", files);
    console.log("Received noOfPage:", noOfPage);

if (!files?.length) throw new Error("No files provided for document upload.");

  try {
    const documentUploads = await Promise.all(files.map(file => uploadFileToS3(file, "CourtCaseDocs")));

    const documentData = documentUploads.map(url => ({ documentUrl: url, uploadedAt: new Date() }));

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
 * Save Court Payment
 */
export const saveTranslationPayment = async ({
  translationCaseId,
  paymentAmount,
  paidCurrency,
  paymentDate,
  customerName,
  session
}) => {
  if (!paymentAmount || !paidCurrency)
    throw new Error("Missing required payment details.");
  try {
    const translationPayment = await TranslationPayment.create(
      [
        {
          translationCase: translationCaseId,
          amount: paymentAmount,
          paidCurrency,
          paymentDate: paymentDate || new Date(),
          paymentStatus: "paid"
        }
      ],
      { session }
    );
    await Notification.create(
      [
        {
          notificationDetails: {
            type: "Payment",
            title: "translationService Payment Successfully Processed",
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
