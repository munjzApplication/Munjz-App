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
        status: "submitted"
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
      `Your notary case for ${serviceName} in ${selectedServiceCountry} has been registered successfully.`
    );

    // Notify Admin
    await notificationService.sendToAdmin(
      "New Notary Case Submitted",
      `A new notary case (${serviceName}) has been registered by ${customer.Name} in ${selectedServiceCountry}.`
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
          from: "customer_transactions",
          localField: "_id",
          foreignField: "caseId",
          as: "paymentDetails"
        }
      },
        // Lookup additional payments
        {
          $lookup: {
              from: "customer_additionatransactions",
              localField: "_id",
              foreignField: "caseId",
              as: "additionalPayments"
          }
      },
       // Calculate total amount paid from both transactions
       {
        $addFields: {
            mainPaymentsTotal: { $sum: "$paymentDetails.amountPaid" },
            additionalPaymentsTotal: { $sum: "$additionalPayments.amount" },
            totalAmountPaid: {
                $add: [
                    { $sum: "$paymentDetails.amountPaid" },
                    { $sum: "$additionalPayments.amount" }
                ]
            },
            paidCurrency: { 
                $ifNull: [{ $arrayElemAt: ["$paymentDetails.currency", 0] }, "N/A"] 
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
          amount: { $ifNull: ["$totalAmountPaid", 0] },  
          paidCurrency: 1
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
