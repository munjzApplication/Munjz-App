import CourtCase from "../../models/Customer/courtServiceModel/courtServiceDetailsModel.js";
import DocumentModel from "../../models/Customer/courtServiceModel/courtServiceDocument.js";
import Payment from "../../models/Customer/courtServiceModel/courtServicePayment.js";
import { uploadFileToS3 } from "../../utils/s3Uploader.js";
import { generateUniqueServiceID } from "../../helper/uniqueIDHelper.js";
import Notification from "../../models/Admin/notificationModels/notificationModel.js";

export const saveCourtCase = async ({
  customerID,
  serviceName,
  selectedServiceCountry,
  caseDescription,
  requesterEmail,
  casePaymentStatus
}) => {
  const courtServiceID = await generateUniqueServiceID("court");

  const courtCase = new CourtCase({
    customerID,
    courtServiceID,
    serviceName,
    selectedServiceCountry,
    caseDescription,
    requesterEmail,
    casePaymentStatus
  });

  await courtCase.save();
  return { courtCase, courtServiceID };
};

export const saveCourtDocuments = async (
  files,
  courtServiceID,
  courtCaseId
) => {
  let originalDocumentUrls = [];

  for (const file of files) {
    const documentUrl = await uploadFileToS3(file, "courtcaseDocs");
    originalDocumentUrls.push({ documentUrl, uploadedAt: new Date() });
  }

  const document = new DocumentModel({
    courtServiceCase: courtCaseId,
    courtServiceID,
    Documents: originalDocumentUrls,
    requestStatus: "unread"
  });

  await document.save();
  return document;
};
export const saveCourtPayment = async ({
  courtServiceID,
  courtCaseId,
  paymentAmount,
  paidCurrency,
  serviceName,
  selectedServiceCountry,
  paymentMethod,
  transactionId,
  paymentDate,
  customerName
}) => {
  const payment = new Payment({
    courtServiceCase: courtCaseId,
    courtServiceID,
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
      type: "Case Registration",
      title: "Court Service Registered With Payment",
      message: `A payment of ${paymentAmount} ${paidCurrency} for your court-Service service has been successfully completed.`,
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
