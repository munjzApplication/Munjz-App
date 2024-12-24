import {
  saveTranslationCase,
  saveTranslationDocuments,
  saveTranslationPayment
} from "../../../../helper/translation/translationHelper.js";
import Customer from "../../../../models/Customer/customerModels/customerModel.js";
import Notification from "../../../../models/Admin/notificationModels/notificationModel.js";
import TranslationDetails from "../../../../models/Customer/translationModel/translationDetails.js";

export const submitTranslationRequest = async (req, res, next) => {
  const { customerID } = req.params;

  try {
    const {
      documentLanguage,
      translationLanguage,
      paymentAmount,
      paidCurrency,
      paymentMethod,
      transactionId,
      paymentDate,
      noOfPage,
      submissionDateTime
    } = req.body;

    // Validate customer existence
    const customer = await Customer.findById(customerID);
    if (!customer) {
      return res.status(400).json({ error: "Invalid customer ID." });
    }

    // Check if the translation case already exists
    const existingCase = await TranslationDetails.findOne({
      customerID,
      documentLanguage,
      translationLanguage
    });
    if (existingCase) {
      return res.status(409).json({
        error: "A translation case with these details is already registered."
      });
    }
    // Determine payment status
    const casePaymentStatus =
      paymentAmount && paidCurrency && paymentMethod && transactionId
        ? "paid"
        : "free";
    const customerName = customer.Name;

    // Save Translation Case
    const {
      translationCase,
      translationServiceID
    } = await saveTranslationCase({
      customerID,
      documentLanguage,
      translationLanguage,
      requesterEmail: customer.email,
      casePaymentStatus,
      submissionDate: new Date()
    });

    // Save Documents
    if (req.files && req.files.length > 0) {
      await saveTranslationDocuments({
        files: req.files,
        translationServiceID,
        translationCaseId: translationCase._id,
        noOfPage,
        submissionDateTime
      });
    }

    // Handle Payment
    if (paymentAmount && paidCurrency && paymentMethod && transactionId) {
      const payment = await saveTranslationPayment({
        translationServiceID,
        translationCaseId: translationCase._id,
        paymentAmount,
        paidCurrency,
        paymentMethod,
        transactionId,
        paymentDate,
        customerName
      });

      return res.status(201).json({
        message:
          "Translation request with payment and documents submitted successfully.",
        translationCase,
        payment
      });
    } else {
      // Save Notification for Free Submission
      const notification = new Notification({
        notificationDetails: {
          type: "Translation Request",
          title: "Translation Request Registered Without Payment",
          message: `The translation request for "${documentLanguage}" to "${translationLanguage}" has been successfully registered for ${customerName} without a payment.`,
          additionalDetails: {
            customerName,
            documentLanguage,
            translationLanguage,
            submissionDateTime,
            paymentStatus: "unpaid"
          }
        }
      });

      await notification.save();

      res.status(201).json({
        message: "Translation request saved successfully without payment.",
        translationCase
      });
    }
  } catch (error) {
    next(error);
  }
};
