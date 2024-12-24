import courtServiceAdditionalPayment from "../../models/Customer/courtServiceModel/courtServiceAdditionalPayment.js";
import notaryServiceAdditionalPayment from "../../models/Customer/notaryServiceModel/notaryServiceAdditionalPayment.js";
import translationAdditionalPayments from "../../models/Customer/translationModel/translationAdditionalPayments.js";

import courtServiceAdditionalDocument from "../../models/Customer/courtServiceModel/courtServiceAdditionalDocuments.js";
import notaryServiceAdditionalDocument from "../../models/Customer/notaryServiceModel/notaryServiceAdditionalDocuments.js";
import translationAdditionalDocument from "../../models/Customer/translationModel/translationAdditionalDocuments.js";

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
  const courtDocuments = await courtServiceAdditionalDocument.find({});
  const notaryDocuments = await notaryServiceAdditionalDocument.find({});
  const translationDocuments = await translationAdditionalDocument.find({});

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
