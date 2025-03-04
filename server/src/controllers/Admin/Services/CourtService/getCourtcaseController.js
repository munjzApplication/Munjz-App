
import courtCaseModel from "../../../../models/Customer/courtServiceModel/courtServiceDetailsModel.js";
import courtCasePayment from "../../../../models/Customer/courtServiceModel/courtServicePayment.js";
import courtCaseeDocument from "../../../../models/Customer/courtServiceModel/courtServiceDocument.js"
import { formatDate } from "../../../../helper/dateFormatter.js";
import mongoose from "mongoose";

export const getAllCourtCases = async (req, res, next) => {
  try {
    let courtCases = await courtCaseModel.aggregate([
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
          from: "courtservice_payments",
          localField: "_id",
          foreignField: "courtServiceCase",
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
          courtServiceID: 1,
          serviceName: 1,
          selectedServiceCountry: 1,
          caseDescription: 1,
          casePaymentStatus: 1,
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
    console.log("courtCases", courtCases);

    courtCases = courtCases.map(courtCases => ({
      ...courtCases,
      createdAt: formatDate(courtCases.createdAt)
    }));

    res.status(200).json({
      message: "Court cases fetched successfully",
      courtCases
    });
  } catch (error) {
    next(error);
  }
};

export const getCaseDocs = async (req, res, next) => {
  try {
    const { caseId } = req.params;

    const [courtCase, courtCaseDoc] = await Promise.all([
      courtCaseModel.findById(caseId),
      courtCaseeDocument.findOne({ courtServiceCase: caseId })
    ]);

    if (!courtCase) {
      return res.status(404).json({ message: "Court case not found" });
    }

    const formattedCase = courtCaseDoc
      ? { ...courtCaseDoc.toObject(), createdAt: formatDate(courtCaseDoc.createdAt) }
      : {};

    res.status(200).json({
      message: "Court case fetched successfully",
      courtCase: formattedCase
    });
  } catch (error) {
    next(error);
  }
};

export const getCourtCaseById = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    let courtCases = await courtCaseModel.aggregate([
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
          from: "courtservice_payments",
          localField: "_id",
          foreignField: "courtServiceCase",
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
          courtServiceID: 1,
          serviceName: 1,
          selectedServiceCountry: 1,
          caseDescription: 1,
          casePaymentStatus: 1,
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

    courtCases = courtCases.map(courtCase => ({
      ...courtCase,
      createdAt: formatDate(courtCase.createdAt)
    }));

    res.status(200).json({
      message: "Court case fetched successfully",
      courtCases
    });
  } catch (error) {
    next(error);
  }
};
