import Document from "../../../../models/Customer/translationModel/translationDocument.js";
import AdditionalDocument from "../../../../models/Customer/translationModel/translationAdditionalDocuments.js";
import Payment from "../../../../models/Customer/translationModel/translationPayment.js";
import AdditionalPayment from "../../../../models/Customer/translationModel/translationAdditionalPayments.js";
import Customer from "../../../../models/Customer/customerModels/customerModel.js";
import TranslationCase from "../../../../models/Customer/translationModel/translationDetails.js";


export const requestDocuments = async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const { reason } = req.body;
    const translationCase = await TranslationCase.findOne({ _id: caseId });
    if (!translationCase) {
      return res.status(404).json({ message: "Translation case not found." });
    }

    const customer = await Customer.findById(translationCase.customerID);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }
    const document = await Document.findOne({ translationCase: caseId });

    if (!document) {
      return res.status(404).json({ message: "Document not fount." });
    }

    if (document.requestStatus === "pending") {
      return res
        .status(400)
        .json({ message: "A document request is already pending" });
    }

    document.requestReason = reason;
    document.requestStatus = "pending";
    document.customerId = customer._id;
    document.requestUpdatedAt = new Date();

    await document.save();

    // Save the requested document into the AdditionalDocument model
    const additionalDocument = new AdditionalDocument({
      translationCase: caseId,
      translationServiceID: document.translationServiceID,
      documents: [], // No files uploaded yet
      requestReason: reason,
      requestStatus: "pending",
      requestUpdatedAt: new Date()
    });

    await additionalDocument.save();
    

    res.status(200).json({
      message: "Document request created successfully.",
      document,
      additionalDocument
    });
  } catch (error) {
    next(error);
  }
};
export const requestAdditionalPayment = async (req, res, next) => {
  try {
    const { caseId } = req.params;  
    const { amount, paidCurrency, requestReason, dueDate } = req.body;

    // Validate required fields
    if (!amount || !paidCurrency || !requestReason || !dueDate) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check if the translation case exists
    const translationCase = await TranslationCase.findOne({ _id: caseId });
    if (!translationCase) {
      return res.status(404).json({ message: "Translation case not found." });
    }

    // Check if the customer exists
    const customer = await Customer.findById(translationCase.customerID);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    // Check for the main payment record
    const mainPayment = await Payment.findOne({ translationCase: caseId });

    // Determine translationServiceID
    const translationServiceID = mainPayment
      ? mainPayment.translationServiceID
      : translationCase.translationServiceID; 

    // Create a new additional payment record
    const newAdditionalPayment = new AdditionalPayment({
      TranslationcaseId: caseId,
      translationServiceID,
      amount,
      paidCurrency,
      requestReason,
      dueDate,
      paymentStatus: "pending", 
      requestedAt: new Date()
    });

    // Save the additional payment record
    await newAdditionalPayment.save();

    // Respond with the created additional payment record
    res.status(201).json({
      message: "Additional payment requested successfully.",
      additionalPayment: newAdditionalPayment
    });
  } catch (error) {
    next(error);
  }
};

