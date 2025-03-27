import payment from "../../models/Customer/customerModels/transaction.js";

import courtServiceDocument from "../../models/Customer/courtServiceModel/courtServiceDocument.js";
import notaryServiceDocument from "../../models/Customer/notaryServiceModel/notaryServiceDocument.js";
import translationDocument from "../../models/Customer/translationModel/translationDocument.js";

// Helper function to fetch all payments (paid and pending)
export const getPayments = async () => {
  const courtPayments = await courtServiceAdditionalPayment.find({});
  const notaryPayments = await notaryServiceAdditionalPayment.find({});
  const translationPayments = await translationAdditionalPayments.find({});

  return {
    paid: [
      ...courtPayments.filter(payment => payment.paymentStatus === "paid").map(payment => ({
        ...payment.toObject(),
        type: "Court Service",
      })),
      ...notaryPayments.filter(payment => payment.paymentStatus === "paid").map(payment => ({
        ...payment.toObject(),
        type: "Notary Service",
      })),
      ...translationPayments.filter(payment => payment.paymentStatus === "paid").map(payment => ({
        ...payment.toObject(),
        type: "Translation Service",
      })),
    ],
    pending: [
      ...courtPayments.filter(payment => payment.paymentStatus === "pending").map(payment => ({
        ...payment.toObject(),
        type: "Court Service",
      })),
      ...notaryPayments.filter(payment => payment.paymentStatus === "pending").map(payment => ({
        ...payment.toObject(),
        type: "Notary Service",
      })),
      ...translationPayments.filter(payment => payment.paymentStatus === "pending").map(payment => ({
        ...payment.toObject(),
        type: "Translation Service",
      })),
    ],
  };
};

// Helper function to fetch all pending documents (both paid and pending)
export const getDocuments = async () => {
  const courtDocuments = await courtServiceDocument.find({});
  const notaryDocuments = await notaryServiceDocument.find({});
  const translationDocuments = await translationDocument.find({});

  return [
    ...courtDocuments.map(doc => ({
      ...doc.toObject(),
      type: "Court Service",
      status: doc.requestStatus,  // Include the document status (pending/completed)
    })),
    ...notaryDocuments.map(doc => ({
      ...doc.toObject(),
      type: "Notary Service",
      status: doc.requestStatus,
    })),
    ...translationDocuments.map(doc => ({
      ...doc.toObject(),
      type: "Translation Service",
      status: doc.requestStatus,
    })),
  ];
};
