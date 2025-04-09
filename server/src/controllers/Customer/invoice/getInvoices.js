import CourtCase from "../../../models/Customer/courtServiceModel/courtServiceDetailsModel.js";
import NotaryCase from "../../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import TranslationCase from "../../../models/Customer/translationModel/translationDetails.js";
import { formatDatewithmonth } from "../../../helper/dateFormatter.js";

export const getCustomerInvoices = async (req, res, next) => {
  try {
    const customerId = req.user._id;

    // Run all three aggregation queries in parallel
    const [courtCases, notaryCases, translationCases] = await Promise.all([
      CourtCase.aggregate([
        { $match: { customerId } },
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: "customer_additionatransactions",
            localField: "_id",
            foreignField: "caseId",
            as: "requestpayments"
          }
        },
        {
          $lookup: {
            from: "courtservice_documents",
            localField: "_id",
            foreignField: "courtServiceCase",
            as: "requestdocuments"
          }
        },
        {
          $addFields: {
            hasAdminRequestedPayment: {
              $gt: [
                {
                  $size: {
                    $filter: {
                      input: "$requestpayments",
                      as: "payment",
                      cond: { $eq: ["$$payment.status", "pending"] }
                    }
                  }
                },
                0
              ]
            },
            hasAdminRequestedDocument: {
              $gt: [
                {
                  $size: {
                    $filter: {
                      input: "$requestdocuments",
                      as: "document",
                      cond: {
                        $and: [
                          { $eq: ["$$document.status", "pending"] },
                          { $eq: ["$$document.documentType", "admin-request"] }
                        ]
                      }
                    }
                  }
                },
                0
              ]
            },
            hasAdminUploadDocument: {
              $gt: [
                {
                  $size: {
                    $filter: {
                      input: "$requestdocuments",
                      as: "document",
                      cond: {
                        $and: [
                          { $eq: ["$$document.status", "submitted"] },
                          { $eq: ["$$document.documentType", "admin-upload"] }
                        ]
                      }
                    }
                  }
                },
                0
              ]
            }
          }
        },
        {
          $addFields: {
            hasAdminAction: {
              $or: [
                "$hasAdminRequestedPayment",
                "$hasAdminRequestedDocument",
                "$hasAdminUploadDocument"
              ]
            }
          }
        },
        {
          $project: {
            createdAt: 1,
            caseType: { $literal: "court" },
            caseId: "$_id",
            serviceID: "$courtServiceID",
            serviceName: 1,
            selectedServiceCountry: 1,
            caseDescription: 1,
            casePaymentStatus: 1,
            follower: 1,
            status: 1,
            amount: "$totalAmountPaid",
            paidCurrency: 1,
            hasAdminAction: 1
          }
        }
      ]),

      NotaryCase.aggregate([
        { $match: { customerId } },
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: "customer_additionatransactions",
            localField: "_id",
            foreignField: "caseId",
            as: "requestpayments"
          }
        },
        {
          $lookup: {
            from: "NotaryService_Document",
            localField: "_id",
            foreignField: "notaryServiceCase",
            as: "requestdocuments"
          }
        },
        {
          $addFields: {
            hasAdminRequestedPayment: {
              $gt: [
                {
                  $size: {
                    $filter: {
                      input: "$requestpayments",
                      as: "payment",
                      cond: { $eq: ["$$payment.status", "pending"] }
                    }
                  }
                },
                0
              ]
            },
            hasAdminRequestedDocument: {
              $gt: [
                {
                  $size: {
                    $filter: {
                      input: "$requestdocuments",
                      as: "document",
                      cond: {
                        $and: [
                          { $eq: ["$$document.status", "pending"] },
                          { $eq: ["$$document.documentType", "admin-request"] }
                        ]
                      }
                    }
                  }
                },
                0
              ]
            },
            hasAdminUploadDocument: {
              $gt: [
                {
                  $size: {
                    $filter: {
                      input: "$requestdocuments",
                      as: "document",
                      cond: {
                        $and: [
                          { $eq: ["$$document.status", "submitted"] },
                          { $eq: ["$$document.documentType", "admin-upload"] }
                        ]
                      }
                    }
                  }
                },
                0
              ]
            }
          }
        },
        {
          $addFields: {
            hasAdminAction: {
              $or: [
                "$hasAdminRequestedPayment",
                "$hasAdminRequestedDocument",
                "$hasAdminUploadDocument"
              ]
            }
          }
        },
        {
          $project: {
            createdAt: 1,
            caseType: { $literal: "notary" },
            caseId: "$_id",
            serviceID: "$notaryServiceID",
            serviceName: 1,
            selectedServiceCountry: 1,
            caseDescription: 1,
            casePaymentStatus: 1,
            follower: 1,
            status: 1,
            amount: "$totalAmountPaid",
            paidCurrency: 1,
            hasAdminAction: 1
          }
        }
      ]),

      TranslationCase.aggregate([
        { $match: { customerId } },
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: "customer_additionatransactions",
            localField: "_id",
            foreignField: "caseId",
            as: "requestpayments"
          }
        },
        {
          $lookup: {
            from: "translation_documents",
            localField: "_id",
            foreignField: "translationCase",
            as: "requestdocuments"
          }
        },
        {
          $addFields: {
            hasAdminRequestedPayment: {
              $gt: [
                {
                  $size: {
                    $filter: {
                      input: "$requestpayments",
                      as: "payment",
                      cond: { $eq: ["$$payment.status", "pending"] }
                    }
                  }
                },
                0
              ]
            },
            hasAdminRequestedDocument: {
              $gt: [
                {
                  $size: {
                    $filter: {
                      input: "$requestdocuments",
                      as: "document",
                      cond: {
                        $and: [
                          { $eq: ["$$document.status", "pending"] },
                          { $eq: ["$$document.documentType", "admin-request"] }
                        ]
                      }
                    }
                  }
                },
                0
              ]
            },
            hasAdminUploadDocument: {
              $gt: [
                {
                  $size: {
                    $filter: {
                      input: "$requestdocuments",
                      as: "document",
                      cond: {
                        $and: [
                          { $eq: ["$$document.status", "submitted"] },
                          { $eq: ["$$document.documentType", "admin-upload"] }
                        ]
                      }
                    }
                  }
                },
                0
              ]
            }
          }
        },
        {
          $addFields: {
            hasAdminAction: {
              $or: [
                "$hasAdminRequestedPayment",
                "$hasAdminRequestedDocument",
                "$hasAdminUploadDocument"
              ]
            }
          }
        },
        {
          $project: {
            createdAt: 1,
            caseType: { $literal: "translation" },
            caseId: "$_id",
            serviceID: "$translationServiceID",
            serviceName: {
              $concat: [
                "Translation from ",
                "$documentLanguage",
                " to ",
                "$translationLanguage"
              ]
            },
            selectedServiceCountry: { $literal: "UAE" },
            caseDescription: { $literal: "Translation Service" },
            casePaymentStatus: "$PaymentStatus",
            follower: 1,
            status: 1,
            amount: "$totalAmountPaid",
            paidCurrency: { $ifNull: ["$paidCurrency", "AED"] },
            hasAdminAction: 1
          }
        }
      ])
    ]);

    // Combine and sort all cases
    const allCases = [...courtCases, ...notaryCases, ...translationCases].map(caseItem => ({
      ...caseItem,
      createdAt: formatDatewithmonth(caseItem.createdAt)
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      message: "All cases fetched successfully",
      cases: allCases
    });
  } catch (error) {
    next(error);
  }
};
