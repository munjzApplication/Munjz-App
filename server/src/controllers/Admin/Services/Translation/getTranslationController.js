
import translationDetails from "../../../../models/Customer/translationModel/translationDetails.js";
import translationPayment from "../../../../models/Customer/translationModel/translationPayment.js";
import translationDocument from "../../../../models/Customer/translationModel/translationDocument.js";
import { formatDate } from "../../../../helper/dateFormatter.js";
import mongoose from "mongoose";

export const getAllTranslations = async (req, res, next) => {
  try {
    let translations = await translationDetails.aggregate([
      {
        $lookup: {
          from: "customer_profiles",
          localField: "customerId",
          foreignField: "_id",
          as: "customer"
        }
      },
      {
        $unwind: "$customer"
      },
      {
        $lookup: {
          from: "translation_payments",
          localField: "_id",
          foreignField: "translationCase",
          as: "payment"
        }
      },
      {
        $unwind: {
          path: "$payment",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          customerId: 1,
          translationServiceID: 1,
          documentLanguage: 1,
          translationLanguage: 1,
          PaymentStatus: 1,
          follower: 1,
          createdAt: 1,
          status: 1,
          customerName: "$customer.Name",
          customerEmail: "$customer.email",
          customerPhone: "$customer.phoneNumber",
          customerProfile: "$customer.profilePhoto",
          paymentAmount: "$payment.amount",
          paymentCurrency: "$payment.paidCurrency"
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    translations = translations.map(translations => ({
      ...translations,
      createdAt: formatDate(translations.createdAt)
    }));

    res.status(200).json({
      message: "Translations fetched successfully",
      translations
    });
  } catch (error) {
    next(error);
  }
};
export const getCaseDocs  = async (req, res, next) => {
  try {
    const { caseId } = req.params;

    // Fetch court case by ID
    const translation = await translationDetails.findById(caseId);
    if (!translation) {
      return res.status(404).json({ message: "translation not found" });
    }

    // Fetch associated court case document
    const translationDoc = await translationDocument.findOne({ translationCase: caseId });

    // Format the court case
    const formattedCase = {
      ...translationDoc.toObject(),
      createdAt: formatDate(translationDoc.createdAt)
    };

    res.status(200).json({
      message: "translation  fetched successfully",
      translation: formattedCase,
      
    });
  } catch (error) {
    next(error);
  }
};


export const getTranslationCaseById = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: "Invalid customerId" });
    }

    console.log("customerId:", customerId);

    let translationCase = await translationDetails.aggregate([
      {
        $match: { customerId: new mongoose.Types.ObjectId(customerId) }
      },
      {
        $lookup: {
          from: "customer_profiles",
          localField: "customerId",
          foreignField: "_id",
          as: "customer"
        }
      },
      {
        $unwind: "$customer"
      },
      {
        $lookup: {
          from: "translation_payments",
          localField: "_id",
          foreignField: "translationCase",
          as: "payment"
        }
      },
      {
        $unwind: {
          path: "$payment",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          customerId: 1,
          translationServiceID: 1,
          documentLanguage: 1,
          translationLanguage: 1,
          PaymentStatus: 1,
          follower: 1,
          createdAt: 1,
          status: 1,
          customerName: "$customer.Name",
          customerEmail: "$customer.email",
          customerPhone: "$customer.phoneNumber",
          customerProfile: "$customer.profilePhoto",
          paymentAmount: "$payment.amount",
          paymentCurrency: "$payment.paidCurrency"
        }
      }
    ]);

    if (!translationCase.length) {
      return res.status(404).json({ message: "Translation case not found" });
    }

    translationCase = translationCase.map(caseItem => ({
      ...caseItem,
      createdAt: formatDate(caseItem.createdAt)
    }));

    res.status(200).json({
      message: "Translation case fetched successfully",
      translationCase
    });
  } catch (error) {
    next(error);
  }
};
