import Transaction from "../../../models/Customer/customerModels/transactionModel.js";
import CustomerProfile from "../../../models/Customer/customerModels/customerModel.js";
import Wallet from "../../../models/Customer/customerModels/walletModel.js";
import {
  formatDate,
  formatMinutesToMMSS
} from "../../../helper/dateFormatter.js";

export const getTransactionDetails = async (req, res, next) => {
  try {
    const customerId = req.user._id;

    // Fetch customer details
    const customer = await CustomerProfile.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found." });
    }

    // Fetch transaction details and sort by createdAt in descending order
    const transactionData = await Transaction.aggregate([
      { $match: { customerId } }, 
      { $sort: { createdAt: -1 } },
      {
        $project: {
          currency: 1,
          amountPaid: 1,
          status: 1,
          createdAt: 1
        }
      }
    ]);

    // Format createdAt using the helper function
    const formattedTransactions = transactionData.map(transaction => ({
      ...transaction,
      createdAt: formatDate(transaction.createdAt) // Using the helper function
    }));

    res.status(200).json({
      message: "Transaction details fetched successfully.",
      data: formattedTransactions
    });
  } catch (error) {
    next(error);
  }
};



export const getWalletDetails = async (req, res, next) => {
  try {
    const customerId = req.user._id;

    // Find wallet details
    const walletData = await Wallet.aggregate([
      { $match: { customerId } }, 
      {
        $project: {
          customerId: 1,
          balance: 1,
          walletActivity: {
            $ifNull: [
              { $sortArray: { input: "$walletActivity", sortBy: { time: -1 } } },
              []
            ]
          }
        }
      }
    ]);

    // If no wallet exists, return empty response
    if (walletData.length === 0) {
      return res.status(200).json({
        message: "Wallet details not found.",
        data: {}
      });
    }

    const wallet = walletData[0];

    // Format balance
    const formattedBalance = wallet.balance > 0 ? formatMinutesToMMSS(wallet.balance) : "0:00";
    const balanceInSec = wallet.balance > 0 ? parseFloat((wallet.balance * 60).toFixed(2)) : 0;

    const formattedWalletActivity = wallet.walletActivity.map(activity => ({
      ...activity,
      minute: formatMinutesToMMSS(activity.minute),
      time: formatDate(activity.time)
    }));

    res.status(200).json({
      message: "Wallet details fetched successfully.",
      data: {
        customerId: wallet.customerId,
        balance: formattedBalance,
        balanceInSec: balanceInSec,
        walletActivity: formattedWalletActivity
      }
    });
  } catch (error) {
    console.error("Error fetching wallet details:", error);
    next(error);
  }
};

