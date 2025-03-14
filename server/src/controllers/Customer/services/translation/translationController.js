import {
  saveTranslationCase,
  saveTranslationDocuments,
  saveTranslationPayment
} from "../../../../helper/translation/translationHelper.js";
import Customer from "../../../../models/Customer/customerModels/customerModel.js";
import TranslationCase from "../../../../models/Customer/translationModel/translationDetails.js";
import mongoose from "mongoose";
import { notificationService } from "../../../../service/sendPushNotification.js";
import { formatDatewithmonth } from "../../../../helper/dateFormatter.js";

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
      noOfPage
    } = req.body;
    
    console.log("reqbody", req.body);
    console.log("reqfile", req.files);

    // Validate customer existence
    const customer = await Customer.findById(customerId).lean();
    if (!customer) throw new Error("Invalid customer");

    const customerName = customer.Name;
    if (!documentLanguage) throw new Error("Document language is required.");
    if (!translationLanguage) throw new Error("Translation language is required.");
    
    if (paymentAmount && !paidCurrency) throw new Error("Paid currency is required for payment.");

    if (!req.files || req.files.length === 0) {
      throw new Error("Document file is required.");
    }

    // Determine Payment Status
    const PaymentStatus = paymentAmount ? "paid" : "unpaid";

    // Save Translation Case
    const { translationCase } = await saveTranslationCase(
      {
        customerId,
        documentLanguage,
        translationLanguage,
        PaymentStatus,
        submissionDate: new Date(),
        status: "submitted"
      },
      session
    );

    // Save Translation Documents
    if (req.files?.length > 0) {
      await saveTranslationDocuments(req.files, translationCase._id, noOfPage, session);
    }

    // Save Payment Details only if paymentAmount exists
    if (paymentAmount) {
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
    }

    await session.commitTransaction();
    
    if (paymentAmount) {
      // **Paid Case**
      await notificationService.sendToCustomer(
        customerId,
        "Translation Request Submitted - Paid",
        `Your translation request (${documentLanguage} → ${translationLanguage}) has been submitted successfully. Payment received.`
      );
    
      await notificationService.sendToAdmin(
        "New Translation Request - Paid",
        `A new PAID translation request (${documentLanguage} → ${translationLanguage}) has been submitted by ${customerName}.`
      );
    } else {
      // **Unpaid Case**
      await notificationService.sendToCustomer(
        customerId,
        "Translation Request Submitted - Unpaid",
        `Your translation request (${documentLanguage} → ${translationLanguage}) has been submitted successfully. Payment is pending.`
      );
    
      await notificationService.sendToAdmin(
        "New Translation Request - Unpaid",
        `A new UNPAID translation request (${documentLanguage} → ${translationLanguage}) has been submitted by ${customerName}.`
      );
    }
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


export const getAllTranslation = async (req, res, next) => {
  try {
    const customerId = req.user._id;

    const translation = await TranslationCase.aggregate([
      { $match: { customerId } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "translation_payments",
          localField: "_id",
          foreignField: "translationCase",
          as: "paymentDetails"
        }
      },
      {
        $unwind: { path: "$paymentDetails", preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          createdAt: 1,
          translationServiceID: 1,
          documentLanguage: 1,
          translationLanguage: 1,
          PaymentStatus: 1,
          follower: 1,
          status: 1,
          amount: "$paymentDetails.amount",
          paidCurrency: "$paymentDetails.paidCurrency"
        }
      }
    ]);

    const translations = translation.map((caseItem) => ({
      ...caseItem,
      createdAt: formatDatewithmonth(caseItem.createdAt)
    }));

    return res
      .status(200)
      .json({ message: "Translations fetched successfully", translations });
  } catch (error) {
    next(error);
  }
};
