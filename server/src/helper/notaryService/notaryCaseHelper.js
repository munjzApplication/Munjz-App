import NotaryCase from "../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import DocumentModel from "../../models/Customer/notaryServiceModel/notaryServiceDocument.js";
import Payment from "../../models/Customer/notaryServiceModel/notaryServicePayment.js";
import { uploadFileToS3 } from "../../utils/s3Uploader.js";
import { generateUniqueServiceID } from "../../helper/uniqueIDHelper.js";
import Notification from "../../models/Admin/notificationModels/notificationModel.js";

export const saveNotaryCase = async ({
  customerId,
  serviceName, 
  selectedServiceCountry, 
  caseDescription, 
  requesterEmail ,
  casePaymentStatus
}) => {
  const notaryServiceID = await generateUniqueServiceID("notary");

  const notaryCase = new NotaryCase({
    customerId,
    notaryServiceID,
    serviceName,
    selectedServiceCountry,
    caseDescription,
    requesterEmail,
    casePaymentStatus
  });

  await notaryCase.save();
  return { notaryCase, notaryServiceID };
};
export const saveNotaryDocuments = async (files,notaryServiceID,notaryCaseId,) => {
  if (!files || files.length === 0) {
    throw new Error("No files provided for document upload.");
  }

  let originalDocumentUrls = [];

  for (const file of files) {
    try {
      const documentUrl = await uploadFileToS3(file, "NotaryCaseDocs");
      originalDocumentUrls.push({ documentUrl, uploadedAt: new Date() });
    } catch (error) {
      console.error("Error uploading file to S3:", error);
      throw new Error("Document upload failed.");
    }
  }

  const document = new DocumentModel({
    notaryServiceCase: notaryCaseId,
    notaryServiceID,
    Documents: originalDocumentUrls,
    requestStatus: "unread"
  });

  await document.save();
  return document;
};
export const saveNotaryPayment = async ({
  notaryServiceID,
  notaryCaseId,
  paymentAmount,
  paidCurrency,
  serviceName,
  selectedServiceCountry,
  paymentMethod,
  transactionId,
  paymentDate,
  customerName
  
}) => {
  if (!paymentAmount || !paidCurrency || !paymentMethod || !transactionId) {
      throw new Error("Missing required payment details.");
  }

  const payment = new Payment({
      notaryServiceCase: notaryCaseId,
      notaryServiceID,
      amount: paymentAmount,
      paidCurrency,
      serviceName,
      serviceCountry: selectedServiceCountry,
      paymentMethod,
      transactionId,
      paymentDate: paymentDate || new Date(),
      paymentStatus: "paid"
  });
  const notification = new Notification({
    notificationDetails: {
      type: "Payment",
      title: "notaryService Payment Successfully Processed",
      message:`A payment of ${paymentAmount} ${paidCurrency} for your notary service has been successfully completed.`,
      additionalDetails: {
        customerName,
        transactionId,
        serviceName,
        country: selectedServiceCountry,
        paymentMethod,
        paymentStatus: "paid"
      }
    }
  });

  await notification.save();
  await payment.save();
  return payment;
};

