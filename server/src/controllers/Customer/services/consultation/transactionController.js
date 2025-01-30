import Transaction from "../../../../models/Customer/customerModels/transactionModel.js";
import Wallet from "../../../../models/Customer/customerModels/walletModel.js";
import AdminEarnings from "../../../../models/Admin/adminModels/earningsModel.js";
import CustomerProfile from "../../../../models/Customer/customerModels/customerModel.js";
import ConsultantProfile from "../../../../models/Consultant/User.js";
import Notification from "../../../../models/Admin/notificationModels/notificationModel.js";
import { notificationService } from "../../../../service/sendPushNotification.js";
import mongoose from "mongoose";

export const createTransaction = async (req, res, next) => {
  try {
    const customerId = req.user.id; // Get customerId from token

    // Fetch customer details
    const customer = await CustomerProfile.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }
    const customerName = customer.Name;

    // Extract transaction details from request body
    const {
      consultantId,
      paymentCurrency,
      paidAmount,
      paidForService,
      paymentReason,
      payerID,
      paymentStatus,
      purchasedMinutes // Minutes purchased
    } = req.body;

    // Validate required fields
    if (
      !consultantId ||
      !paymentCurrency ||
      !paidAmount ||
      !paidForService ||
      !paymentReason ||
      !payerID ||
      !paymentStatus ||
      purchasedMinutes === undefined
    ) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Validate MongoDB ObjectId for consultant
    if (!mongoose.Types.ObjectId.isValid(consultantId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid consultant ID format." });
    }

    // Check if consultant exists
    const consultant = await ConsultantProfile.findById(consultantId);
    if (!consultant) {
      return res
        .status(404)
        .json({ success: false, message: "Consultant not found." });
    }

    // Validate purchased minutes
    if (typeof purchasedMinutes !== "number" || purchasedMinutes <= 0) {
      return res.status(400).json({ message: "Invalid purchased minutes." });
    }

    // Validate paid amount
    if (typeof paidAmount !== "number" || paidAmount <= 0) {
      return res.status(400).json({ message: "Invalid paid amount." });
    }

    // Create a new transaction
    const newTransaction = new Transaction({
      customerId,
      currency: paymentCurrency,
      amountPaid: paidAmount,
      serviceType: paidForService,
      reason: paymentReason,
      payerId: payerID,
      status: paymentStatus,
      purchasedMinutes // Store minutes in DB
    });

    await newTransaction.save();

    // Get current timestamp
    const transactionTime = new Date();

    // Update or create wallet (Only add minutes, keep balance unchanged)
    let wallet = await Wallet.findOne({ customerId });

    if (wallet) {
      wallet.balance += purchasedMinutes; // Add minutes to wallet
      wallet.walletActivity.push({
        status: "+",
        minute: purchasedMinutes,
        time: transactionTime
      });
    } else {
      wallet = new Wallet({
        customerId,
        balance: purchasedMinutes, // New balance
        walletActivity: [
          {
            status: "+",
            minute: purchasedMinutes,
            time: transactionTime
          }
        ]
      });
    }

    await wallet.save();

    // Create a new earnings record for each transaction
    const earnings = new AdminEarnings({
      consultantId,
      currency: paymentCurrency,
      totalEarnings: paidAmount, // Save the full paid amount for each transaction
      serviceName: paidForService,
      reason: paymentReason
    });

    await earnings.save();

    // Create notification
    const notification = new Notification({
      notificationDetails: {
        type: "Payment",
        title: "Payment Successfully Processed",
        message: `Your payment of ${paidAmount} ${paymentCurrency} has been successfully completed. You have received ${purchasedMinutes} minutes.`,
        additionalDetails: {
          customerName,
          paymentId: newTransaction._id,
          amount: paidAmount,
          currency: paymentCurrency,
          paymentStatus,
          purchasedMinutes
        }
      }
    });

    await notification.save();

    // Send push notification
    try {
      await notificationService.sendToCustomer(
        customerId,
        "Payment Successful",
        `Your payment of ${paidAmount} ${paymentCurrency} has been processed. You have received ${purchasedMinutes} minutes.`,
        {
          paymentId: newTransaction._id,
          amount: paidAmount,
          currency: paymentCurrency,
          paymentStatus,
          purchasedMinutes
        }
      );
    } catch (error) {
      console.error("Error sending notification to customer:", error);
    }

    // Respond with success
    res.status(201).json({
      message: "Transaction successfully completed"
    });
  } catch (error) {
    console.error("Error in createTransaction:", error);
    next(error);
  }
};
