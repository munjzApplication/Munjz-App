import CustomerTransaction from "../../../models/Customer/customerModels/transaction.js";
import CustomerAdditionalTransaction from "../../../models/Customer/customerModels/additionalTransaction.js";
import mongoose from "mongoose";
import { formatDate } from "../../../helper/dateFormatter.js";

const buildTransactionAggregation = () => ([
  {
    $lookup: {
      from: "customer_profiles",
      localField: "customerId",
      foreignField: "_id",
      as: "customer"
    }
  },
  { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: "courtservice_cases",
      localField: "caseId",
      foreignField: "_id",
      as: "courtCase"
    }
  },
  {
    $lookup: {
      from: "notaryservice_cases",
      localField: "caseId",
      foreignField: "_id",
      as: "notaryCase"
    }
  },
  {
    $lookup: {
      from: "translation_cases",
      localField: "caseId",
      foreignField: "_id",
      as: "translationCase"
    }
  },
  {
    $addFields: {
      serviceUniqueID: {
        $switch: {
          branches: [
            {
              case: { $eq: ["$caseType", "CourtService_Case"] },
              then: { $arrayElemAt: ["$courtCase.courtServiceID", 0] }
            },
            {
              case: { $eq: ["$caseType", "NotaryService_Case"] },
              then: { $arrayElemAt: ["$notaryCase.notaryServiceID", 0] }
            },
            {
              case: { $eq: ["$caseType", "Translation_Case"] },
              then: { $arrayElemAt: ["$translationCase.translationServiceID", 0] }
            }
          ],
          default: null
        }
      }
    }
  },
  {
    $project: {
      _id: 1,
      customerId: 1,
      caseId: 1,
      serviceType: 1,
      amount: { $ifNull: ["$amountPaid", "$amount"] },
      currency: { $ifNull: ["$currency", "$paidCurrency"] },
      requestReason: 1,
      dueDate: 1,
      status: 1,
      paymentDate: 1,
      requestedAt: 1,
      createdAt: 1,
      serviceUniqueID: 1
    }
  },
  { $sort: { createdAt: -1 } }
]);

export const getCustomerInvoices = async (req, res, next) => {
  try {
    const customerId = new mongoose.Types.ObjectId(req.user._id);
    const statusFilter = req.query.status || "AllStatus";

    const baseMatch = { customerId };
    if (statusFilter !== "AllStatus") {
      baseMatch.status = statusFilter;
    }

    const fullAggregation = [
      { $match: baseMatch },
      ...buildTransactionAggregation()
    ];

    const [invoices, additionalInvoices] = await Promise.all([
      CustomerTransaction.aggregate(fullAggregation),
      CustomerAdditionalTransaction.aggregate(fullAggregation)
    ]);

    let allInvoices = [...invoices, ...additionalInvoices];

    // Format date fields
    allInvoices = allInvoices.map((inv) => ({
      ...inv,
      createdAt: inv.createdAt ? formatDate(inv.createdAt) : null,
      paymentDate: inv.paymentDate ? formatDate(inv.paymentDate) : null,
      dueDate: inv.dueDate ? formatDate(inv.dueDate) : null,
      requestedAt: inv.requestedAt ? formatDate(inv.requestedAt) : null
    }));

    res.status(200).json({
      message: "Customer invoices retrieved successfully",
      data: allInvoices
    });
  } catch (error) {
    console.error("Error getting invoices:", error);
    next(error);
  }
};
