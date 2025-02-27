import {
  saveTranslationCase,
  saveTranslationDocuments,
  saveTranslationPayment
} from "../../../../helper/translation/translationHelper.js";
import Customer from "../../../../models/Customer/customerModels/customerModel.js";
import Notification from "../../../../models/Admin/notificationModels/notificationModel.js";
import TranslationCase from "../../../../models/Customer/translationModel/translationDetails.js";
import mongoose from "mongoose";
import { formatDatewithmonth  } from "../../../../helper/dateFormatter.js";

export const submitTranslationRequest = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const customerId = req.user._id;
    const {
      documentLanguage,
      translationLanguage,
      paymentAmount,
      paidCurrency,
      noOfPage,
    } = req.body;

    // Validate customer existence
    const customer = await Customer.findById(customerId).lean();
    if (!customer) throw new Error("Invalid customer");

    const customerName = customer.Name;

    if (paymentAmount && !paidCurrency)
      throw new Error(" Payment is required for registration.");

    const { translationCase, translationServiceID } = await saveTranslationCase(
      {
        customerId,
        documentLanguage,
        translationLanguage,
        casePaymentStatus: "free",
        submissionDate: new Date(),
        status: "submitted"
      },
      session
    );
    console.log("kkkkk",req.files);
    
    if (req.files?.length > 0) {
      await saveTranslationDocuments(req.files,translationCase._id,noOfPage,session);


    }
    await saveTranslationPayment(
      {
        translationCaseId: translationCase._id,
        paymentAmount,
        paidCurrency,
        customerName,
        customerId
      },
      session
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "Translation request submitted successfully",

    });
  } catch (error) {
    console.log("Error in submitting translation request", error);
    await session.abortTransaction();
    session.endSession();
    next(error);

  }
};

