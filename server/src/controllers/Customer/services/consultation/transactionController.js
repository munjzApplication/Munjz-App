import Transaction from "../../../../models/Customer/customerModels/transactionModel.js";
import Wallet from "../../../../models/Customer/customerModels/walletModel.js";
import CustomerProfile from "../../../../models/Customer/customerModels/customerModel.js";
import consultantProfile from "../../../../models/Consultant/User.js";
import Notification from "../../../../models/Admin/notificationModels/notificationModel.js";
import { notificationService } from "../../../../service/sendPushNotification.js";
export const createTransaction = async (req, res, next) => {
  try {
    const {
      customerId,
      consultantId,
      paymentCurrency,
      paidAmount,
      paidForService,
      payerID,
      paymentNote,
      paymentStatus,
      selectedTime
    } = req.body;


    if (
      !consultantId ||
      !customerId ||
      !paymentCurrency ||
      !paidAmount ||
      !paidForService ||
      !payerID ||
      !paymentStatus
    ) {
      return res.status(400).json({
        message: "Missing required fields."
      });
    }

    if (typeof selectedTime !== "number" || selectedTime <= 0) {
      return res.status(400).json({
        message: "Invalid selected time."
      });
    }


    const customer = await CustomerProfile.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        message: "Customer not found."
      });
    }
    const customerName = customer.Name;

    const consultant = await consultantProfile.findById(consultantId);
    if (!consultant) {
      return res.status(404).json({
        message: "Consultant not found."
      });
    }


    const newTransaction = new Transaction({
      consultantId,
      customerId,
      paymentCurrency,
      paidAmount,
      paidForService,
      payerID,
      paymentNote,
      paymentStatus,
      paymentTime: Date.now()
    });

    await newTransaction.save();

    const wallet = await Wallet.findOne({ customerId });

    if (wallet) {
      wallet.balance += paidAmount;
      await wallet.save();
    } else {
      const newWallet = new Wallet({
        customerId,
        balance: paidAmount
      });
      await newWallet.save();
    }

    const notification = new Notification({
      notificationDetails: {
        type: "Payment",
        title: "Consultation Payment Successfully Processed",
        message: `A payment of ${paidAmount} ${paymentCurrency} for your consultation service has been successfully completed.`,
        additionalDetails: {
          customerName: customerName,
          consultantName: consultant.Name,
          paymentId: newTransaction._id,
          amount: paidAmount,
          currency: paymentCurrency,
          paymentStatus: paymentStatus
        }
      }
    });

    await notification.save();

    // Send Push Notification to Customer
    try {
      await notificationService.sendToCustomer(
        customerId,
        "Payment Successful",
        `Your payment of ${paidAmount} ${paymentCurrency} has been successfully processed.`,
        {
          paymentId: newTransaction._id,
          amount: paidAmount,
          currency: paymentCurrency,
          paymentStatus: paymentStatus
        }
      );
    } catch (error) {
      console.error("Error sending notification to customer:", error);
    }

    res.status(201).json({
      message: "Transaction and wallet updated successfully.",
      transaction: newTransaction
    });
  } catch (error) {
    next(error);
  }
};
