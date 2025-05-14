import Transaction from "../../../../models/Customer/customerModels/transaction.js";
import Wallet from "../../../../models/Customer/customerModels/walletModel.js";
import AdminEarnings from "../../../../models/Admin/adminModels/earningsModel.js";
import CustomerProfile from "../../../../models/Customer/customerModels/customerModel.js";
import { notificationService } from "../../../../service/sendPushNotification.js";
import {emitAdminEarningsSocket} from "../../../../socket/emitAdminEarningsSocket.js";



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
      purchasedMinutes,
      paymentDate : new Date()
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
      customerId,
      currency: paymentCurrency,
      serviceAmount: paidAmount, // Save the full paid amount for each transaction
      serviceName: paidForService,
      reason: paymentReason
    });

    await earnings.save();
    await emitAdminEarningsSocket(earnings);

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
