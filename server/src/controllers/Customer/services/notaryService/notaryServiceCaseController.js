import {
  saveNotaryCase,
  saveNotaryDocuments,
  saveNotaryPayment
} from "../../../../helper/notaryService/notaryCaseHelper.js";
import Customer from "../../../../models/Customer/customerModels/customerModel.js";

import NotaryCase from "../../../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import notaryServicePayment from "../../../../models/Customer/notaryServiceModel/notaryServicePayment.js";
import { formatDatewithmonth } from "../../../../helper/dateFormatter.js";
import { notificationService } from "../../../../service/sendPushNotification.js";
import mongoose from "mongoose";

export const saveNotaryServiceDetails = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log("Transaction Started...");
    console.log("reqbody", req.body);
    console.log("reqfile", req.files);
    const customerId = req.user._id;
    const {
      serviceName,
      selectedServiceCountry,
      caseDescription,
      paymentAmount,
      paidCurrency,
      paymentDate
    } = req.body;

    // Validate customer
    const customer = await Customer.findById(customerId).lean();
    if (!customer) throw new Error("Invalid customer");

    const customerName = customer.Name;

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

    console.log("Notary Case Saved:", notaryCase._id);

    // Step 2: Save Documents (if any)
    if (req.files?.length > 0) {
      await saveNotaryDocuments(req.files, notaryCase._id, session);
    }

    // Step 3: Save Payment
    console.log("Processing payment...");
    await saveNotaryPayment(
      {
        notaryCaseId: notaryCase._id,
        paymentAmount,
        paidCurrency,
        serviceName,
        selectedServiceCountry,
        paymentDate,
        customerName,
        customerId
      },
      session
    );
    console.log("Payment processed successfully.");

    // ✅ Commit transaction if everything is successful
    await session.commitTransaction();
    session.endSession();
    console.log("Transaction Committed!");

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
          from: "notaryservice_payments",
          localField: "_id",
          foreignField: "notaryServiceCase",
          as: "paymentDetails"
        }
      },
      {
        $unwind: { path: "$paymentDetails", preserveNullAndEmptyArrays: true }
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
          amount: "$paymentDetails.amount",
          paidCurrency: "$paymentDetails.paidCurrency"
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
