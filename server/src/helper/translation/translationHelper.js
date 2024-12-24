import TranslationDetails from "../../models/Customer/translationModel/translationDetails.js";
import TranslationDocument from "../../models/Customer/translationModel/translationDocument.js";
import TranslationPayment from "../../models/Customer/translationModel/translationPayment.js";
import { uploadFileToS3 } from "../../utils/s3Uploader.js";
import { generateUniqueServiceID } from "../../helper/uniqueIDHelper.js";
import Notification from "../../models/Admin/notificationModels/notificationModel.js";

// Helper to save Translation Case
export const saveTranslationCase = async ({
  customerID,
  documentLanguage,
  translationLanguage,
  requesterEmail,
  casePaymentStatus,
  submissionDate
}) => {
  const translationServiceID = await generateUniqueServiceID("translation");

  const translationCase = new TranslationDetails({
    customerID,
    translationServiceID,
    documentLanguage,
    translationLanguage,
    requesterEmail,
    casePaymentStatus,
    submissionDate
  });

  await translationCase.save();
  return { translationCase, translationServiceID };
};

// Helper to save Translation Documents
export const saveTranslationDocuments = async ({
  files,
  translationServiceID,
  translationCaseId,
  noOfPage,
  SubmitionDateTime
}) => {
  const documentUrls = await Promise.all(
    files.map(async file => {
      const documentUrl = await uploadFileToS3(file, "TranslationDocuments");
      const documentType = file.mimetype.includes("pdf") ? "pdf" : "image";
      return { documentUrl, uploadedAt: new Date(), documentType };
    })
  );

  const translationDocument = new TranslationDocument({
    translationCase: translationCaseId,
    translationServiceID,
    Documents: documentUrls,
    noOfPage,
    SubmitionDateTime
  });

  await translationDocument.save();
  return translationDocument;
};

// Helper to save Translation Payment
export const saveTranslationPayment = async ({
  translationServiceID,
  translationCaseId,
  paymentAmount,
  paidCurrency,
  paymentMethod,
  transactionId,
  paymentDate,
  customerName
}) => {
  const translationPayment = new TranslationPayment({
    translationCase: translationCaseId,
    translationServiceID,
    amount: paymentAmount,
    paidCurrency,
    paymentMethod,
    transactionId,
    paymentDate: paymentDate || new Date(),
    paymentStatus: "paid"
  });
  const notification = new Notification({
    notificationDetails: {
      type: "Payment",
      title: "translationService Payment Successfully Processed",
      message: `Your payment of ${paymentAmount} ${paidCurrency} has been successfully processed.`,
      additionalDetails: {
        customerName,
        transactionId,
        paymentMethod,
        paymentStatus: "paid"
      }
    }
  });

  await notification.save();
  await translationPayment.save();
  return translationPayment;
};
