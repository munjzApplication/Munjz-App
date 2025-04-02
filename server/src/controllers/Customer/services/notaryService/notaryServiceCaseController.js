import {
  saveNotaryCase,
  saveNotaryDocuments,
  saveNotaryPayment
} from "../../../../helper/notaryService/notaryCaseHelper.js";
import Customer from "../../../../models/Customer/customerModels/customerModel.js";
import NotaryCase from "../../../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import { formatDatewithmonth } from "../../../../helper/dateFormatter.js";
import { notificationService } from "../../../../service/sendPushNotification.js";
import mongoose from "mongoose";

export const saveNotaryServiceDetails = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const customerId = req.user._id;
    const {
      serviceName,
      selectedServiceCountry,
      caseDescription,
      paymentAmount,
      paidCurrency,
    } = req.body;

    // Validate customer
    const customer = await Customer.findById(customerId).lean();
    if (!customer) throw new Error("Invalid customer");


    if (!paymentAmount || !paidCurrency)
      throw new Error("Payment is required for registration.");

    // Step 1: Save Notary Case
    const { notaryCase, notaryServiceID } = await saveNotaryCase(
      {
        customerId,
        serviceName,
        selectedServiceCountry,
        caseDescription,
        casePaymentStatus: "paid",
        status: "submitted",
        paymentAmount,
        paidCurrency

      },
      session
    );

  

    if (req.files?.length > 0) {
      await saveNotaryDocuments(req.files, notaryCase._id, session);
    }


    await saveNotaryPayment(
      {
        notaryCaseId: notaryCase._id,
        paymentAmount,
        paidCurrency,
        paymentDate: new Date(),
        customerId
      },
      session
    );
  
    await session.commitTransaction();
    session.endSession();

    // Notify Customer
    await notificationService.sendToCustomer(
      customerId,
      "Notary Case Registered",
      `Your notary case (Case ID: ${notaryServiceID}) has been registered successfully, with a payment of ${paymentAmount} ${paidCurrency}.`
    );

    // Notify Admin
    await notificationService.sendToAdmin(
      "New Notary Case Registered",
      `A new notary case (Case ID: ${notaryServiceID}) has been registered with a payment of ${paymentAmount} ${paidCurrency}.`
    );
    return res.status(201).json({
      message: "Notary case registered successfully"
    });
  } catch (error) {
    console.error("Error in saveNotaryServiceDetails:", error);
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const getAllNotaryCases = async (req, res, next) => {
  try {
    const customerId = req.user._id;

    const notaryCases = await NotaryCase.aggregate([
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
        // Lookup additional payments
        {
          $lookup: {
              from: "NotaryService_Document",
              localField: "_id",
              foreignField: "notaryServiceCase",
              as: "requestdocuments"
          }
      },
       // Calculate total amount paid from both transactions
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
                  }, 0]
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
                  }, 0]
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
                  }, 0]
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
          notaryServiceID: 1,
          serviceName: 1,
          selectedServiceCountry: 1,
          caseDescription: 1,
          casePaymentStatus: 1,
          follower: 1,
          status: 1,
          amount: "$totalAmountPaid",
          paidCurrency: 1,
          hasAdminAction: 1,
        }
      }
    ]);

    const formattedCases = notaryCases.map((caseItem) => ({
      ...caseItem,
      createdAt: formatDatewithmonth(caseItem.createdAt)
    }));

    return res
      .status(200)
      .json({ message: "Notary cases fetched successfully", formattedCases });
  } catch (error) {
    next(error);
  }
};
