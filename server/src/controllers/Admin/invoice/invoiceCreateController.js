import { 
  saveCourtCase, 
  saveCourtDocuments, 
  saveCourtPayment 
} from "../../../helper/courtService/courtCaseHelper.js";

import { 
  saveNotaryCase, 
  saveNotaryDocuments, 
  saveNotaryPayment 
} from "../../../helper/notaryService/notaryCaseHelper.js";

import { 
  saveTranslationCase, 
  saveTranslationDocuments, 
  saveTranslationPayment 
} from "../../../helper/translation/translationHelper.js";

import Customer from "../../../models/Customer/customerModels/customerModel.js";

export const CreateCase = async (req, res, next) => {
  try {
    // Parse serviceData and paymentData
    const serviceData = typeof req.body.serviceData === "string" 
      ? JSON.parse(req.body.serviceData) 
      : req.body.serviceData;

    const paymentData = typeof req.body.paymentData === "string" 
      ? JSON.parse(req.body.paymentData) 
      : req.body.paymentData;

    const { caseType, note } = req.body;
    const files = req.files || []; // Handle uploaded files

    // Validate the customer
    const customer = await Customer.findOne({ email: serviceData.requesterEmail });
    if (!customer) {
      return res.status(400).json({ error: "Customer does not exist." });
    }

    let caseDetails, serviceId, documents = [], payment = null;

    // Process based on case type
    if (caseType === "court") {
      ({ courtCase: caseDetails, courtServiceID: serviceId } = await saveCourtCase({
        ...serviceData,
        note,
      }));

      if (files.length > 0) {
        documents = await saveCourtDocuments({
          files,
          courtServiceID: serviceId,
          courtCaseId: caseDetails._id,
        });
      }

      if (paymentData) {
        const normalizedPaymentData = {
          ...paymentData,
          selectedServiceCountry: paymentData.serviceCountry || serviceData.serviceCountry,
        };

        payment = await saveCourtPayment({
          courtServiceID: serviceId,
          courtCaseId: caseDetails._id,
          ...normalizedPaymentData,
        });
      }
    } else if (caseType === "notary") {
      ({ notaryCase: caseDetails, notaryServiceID: serviceId } = await saveNotaryCase({
        ...serviceData,
        note,
      }));

      if (files.length > 0) {
        documents = await saveNotaryDocuments({
          files,
          notaryServiceID: serviceId,
          notaryCaseId: caseDetails._id,
        });
      }

      if (paymentData) {
        const normalizedPaymentData = {
          ...paymentData,
          selectedServiceCountry: paymentData.serviceCountry || serviceData.serviceCountry,
        };

        payment = await saveNotaryPayment({
          notaryServiceID: serviceId,
          notaryCaseId: caseDetails._id,
          ...normalizedPaymentData,
        });
      }
    } else if (caseType === "translation") {
      if (!serviceData.documentLanguage || !serviceData.translationLanguage) {
        return res.status(400).json({
          success: false,
          message: "documentLanguage and translationLanguage are required for translation cases.",
        });
      }

      ({ translationCase: caseDetails, translationServiceID: serviceId } = await saveTranslationCase({
        ...serviceData,
        note,
      }));

      if (files.length > 0) {
        documents = await saveTranslationDocuments({
          files,
          translationServiceID: serviceId,
          translationCaseId: caseDetails._id,
          noOfPage: serviceData.noOfPage,
          SubmitionDateTime: serviceData.SubmitionDateTime,
        });
      }

      if (paymentData) {
        const normalizedPaymentData = {
          ...paymentData,
          selectedServiceCountry: paymentData.serviceCountry || serviceData.serviceCountry,
        };

        payment = await saveTranslationPayment({
          translationServiceID: serviceId,
          translationCaseId: caseDetails._id,
          ...normalizedPaymentData,
        });
      }
    } else {
      return res.status(400).json({ error: "Invalid case type." });
    }

    // Respond with the created case details
    res.status(201).json({
      message: `Case for ${caseType} created successfully.`,
      caseDetails,
      documents,
      payment,
    });
  } catch (error) {
    console.error("Error in CreateCase:", error);
    next(error);
  }
};
