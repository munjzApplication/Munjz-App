import notaryCaseModel from "../../../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import notaryCaseDocument from "../../../../models/Customer/notaryServiceModel/notaryServiceDocument.js";
import { formatDate } from "../../../../helper/dateFormatter.js";
import customerProfileModel from "../../../../models/Customer/customerModels/customerModel.js";
import CustomerTransaction from "../../../../models/Customer/customerModels/transaction.js";
import AdditionalPayment from "../../../../models/Customer/customerModels/additionalTransaction.js";

import mongoose from "mongoose";

export const getAllNotaryCases = async (req, res, next) => {
  try {
    let notaryCases = await notaryCaseModel.aggregate([
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
          notaryServiceID: 1,
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
          paymentAmount: "$totalAmountPaid", 
          paymentCurrency: "$paidCurrency", 
          hasPendingPayment: 1
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    notaryCases = notaryCases.map(notaryCase => ({
      ...notaryCase,
      createdAt: formatDate(notaryCase.createdAt)
    }));

    res.status(200).json({
      message: "Notary cases fetched successfully",
      notaryCases
    });
  } catch (error) {
    next(error);
  }
};


export const getCaseDocs = async (req, res, next) => {
  try {
    const { caseId } = req.params;

    const caseDocuments = await notaryCaseDocument.aggregate([
      { $match: { notaryServiceCase: new mongoose.Types.ObjectId(caseId) } },
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


    // Format dates
    const formattedDocs = caseDocuments.map(doc => ({
      ...doc,
      createdAt: formatDate(doc.createdAt)
    }));

    res.status(200).json({
      message: "Documents fetched successfully",
      notaryServiceCase: caseId,
      documents: formattedDocs || []
    });
  } catch (error) {
    next(error);
  }
};



export const getNotaryCaseById = async (req, res, next) => {
  try {
    const { customerId } = req.params;

        // Validate if customer exists
        const customerExists = await customerProfileModel.findById(customerId);
        if (!customerExists) {
          return res.status(404).json({ message: "Customer not found" });
        }
    

    let notaryCases = await notaryCaseModel.aggregate([
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
          notaryServiceID: 1,
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
          paymentAmount: "$totalAmountPaid", 
          paymentCurrency: "$paidCurrency", 
          hasPendingPayment: 1
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    notaryCases = notaryCases.map(notaryCase => ({
      ...notaryCase,
      createdAt: formatDate(notaryCase.createdAt)
    }));

    res.status(200).json({
      message: "Notary case fetched successfully",
      notaryCases
    });
  } catch (error) {
    next(error);
  }
};

export const getAllNotaryPayments = async (req, res, next) => {
  try {
    const { caseId } = req.params;

    if (!caseId) {
      return res.status(400).json({ message: "Case ID is required" });
    }

    const caseObjectId = new mongoose.Types.ObjectId(caseId);

    // Fetch all transactions and additional payments in parallel
    const [paidTransactions, pendingTransactions] = await Promise.all([
      // Fetch all "paid" transactions from both collections
      Promise.all([
        CustomerTransaction.find({ caseId: caseObjectId, caseType: "NotaryService_Case", status: "paid" }),
        AdditionalPayment.find({ caseId: caseObjectId, caseType: "NotaryService_Case", status: "paid" })
      ]).then(([customerPaid, additionalPaid]) => [...customerPaid, ...additionalPaid]),

      // Fetch all "pending" additional payments
      AdditionalPayment.find({ caseId: caseObjectId, caseType: "NotaryService_Case", status: "pending" })
    ]);

     // Format dates before sending response
     const formattedPaidTransactions = paidTransactions.map((transaction) => ({
      _id: transaction._id,
      customerId: transaction.customerId,
      caseId: transaction.caseId,
      caseType: transaction.caseType,
      serviceType: transaction.serviceType,
      amountPaid: transaction.amount || transaction.amountPaid,
      currency: transaction.currency || transaction.paidCurrency,
      status: transaction.status,
      paymentDate: formatDate(transaction.createdAt), 
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    }));


    const formattedPendingTransactions = pendingTransactions.map((transaction) => ({
      _id: transaction._id,
      customerId: transaction.customerId,
      caseId: transaction.caseId,
      caseType: transaction.caseType,
      serviceType: transaction.serviceType,
      amountPaid: transaction.amount || transaction.amountPaid,
      currency: transaction.currency || transaction.paidCurrency,
      requestReason: transaction.requestReason,
      dueDate: formatDate(transaction.dueDate),
      paymentDate: formatDate(transaction.paymentDate),
      status: transaction.status,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    }));

    // Construct response
    return res.status(200).json({
      message: "Notary payments fetched successfully",
      paidTransactions : formattedPaidTransactions,
      pendingTransactions: formattedPendingTransactions
    });
  } catch (error) {
    next(error);
  }
};
