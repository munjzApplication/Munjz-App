
import courtCaseModel from "../../../../models/Customer/courtServiceModel/courtServiceDetailsModel.js";
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
        $lookup: {
          from: "customer_additionatransactions", // Match collection name in lowercase
          let: { caseId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$caseId", "$$caseId"] },
                    { $eq: ["$status", "pending"] } // Check if any additional payment is pending
                  ]
                }
              }
            },
            { $limit: 1 } // If at least one pending payment exists, it's enough
          ],
          as: "pendingPayments"
        }
      },
      {
        $addFields: {
          hasPendingPayment: { $gt: [{ $size: "$pendingPayments" }, 0] } // Returns true if there are pending payments
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
          paymentCurrency: "$payment.paidCurrency",
          hasPendingPayment: 1 // Include the true/false value in response
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    console.log("courtCases", courtCases);

    courtCases = courtCases.map(courtCase => ({
      ...courtCase,
      createdAt: formatDate(courtCase.createdAt)
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


    const caseDocuments = await courtCaseeDocument.aggregate([
      { $match: { courtServiceCase: new mongoose.Types.ObjectId(caseId) } },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          _id: 1,
          documentType: 1,
          documents: 1,
          description: 1,
          uploadedBy: 1,
          status: 1,
          requestReason: 1,
          createdAt: 1
        }
      }
    ]);

    if (caseDocuments.length === 0) {
      return res.status(404).json({ message: "No documents found for this case." });
    }

    // Format dates
    const formattedDocs = caseDocuments.map(doc => ({
      ...doc,
      createdAt: formatDate(doc.createdAt)
    }));

    res.status(200).json({
      message: "Documents fetched successfully",
      courtServiceCase: caseId,
      documents: formattedDocs
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



