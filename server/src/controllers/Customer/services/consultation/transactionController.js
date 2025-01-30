import Transaction from "../../../../models/Customer/customerModels/transactionModel.js";
import Wallet from "../../../../models/Customer/customerModels/walletModel.js";
import CustomerProfile from "../../../../models/Customer/customerModels/customerModel.js";
import Notification from "../../../../models/Admin/notificationModels/notificationModel.js";
import { notificationService } from "../../../../service/sendPushNotification.js";

export const createTransaction = async (req, res, next) => {
  try {
    const customerId = req.user.id;  // Get customerId from token

    // Fetch customer details FIRST
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
      payerID,
      paymentStatus,
      purchasedMinutes,  // Minutes purchased
    } = req.body;

    // Validate required fields
    if (!paymentCurrency || !paidAmount || !paidForService || !payerID || !paymentStatus || !purchasedMinutes) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Validate purchased minutes
    if (typeof purchasedMinutes !== "number" || purchasedMinutes <= 0) {
      return res.status(400).json({ message: "Invalid purchased minutes." });
    }

    // Create a new transaction
    const newTransaction = new Transaction({
      customerId,
      currency: paymentCurrency,
      amountPaid: paidAmount,
      serviceType: paidForService,
      payerId: payerID,
      status: paymentStatus,
      purchasedMinutes  // Store minutes in DB
    });

    await newTransaction.save();

    // Update or create wallet (Only add minutes, keep balance unchanged)
    let wallet = await Wallet.findOne({ customerId });

    if (wallet) {
      wallet.balance = (wallet.balance || 0) + purchasedMinutes;  // Add minutes to wallet
    } else {
      wallet = new Wallet({ customerId, balance: 0, balance: purchasedMinutes });  // Balance stays 0
    }
    await wallet.save();

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
      message: "Transaction successfully completed",
    });
  } catch (error) {
    console.error("Error in createTransaction:", error);
    next(error);
  }
};

