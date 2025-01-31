import Transaction from "../../../models/Customer/customerModels/transactionModel.js";
import CustomerProfile from "../../../models/Customer/customerModels/customerModel.js";
import Wallet from "../../../models/Customer/customerModels/walletModel.js";
import {
  formatDate,
  formatMinutesToHM,
  formatMinutesToFixed
} from "../../../helper/dateFormatter.js";

export const getTransactionDetails = async (req, res, next) => {
  try {
    const customerId = req.user._id;

    // Fetch customer details
    const customer = await CustomerProfile.findById(customerId);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found." });
    }

    // Fetch transaction details and sort by createdAt in descending order using aggregate
    const transactionData = await Transaction.aggregate([
      { $match: { customerId } }, // Match by customerId
      { $sort: { createdAt: -1 } }, // Sort by createdAt in descending order
      { 
        $project: { 
          currency: 1, 
          amountPaid: 1, 
          status: 1, 
          createdAt: 1 
        } 
      }
    ]);

    if (!transactionData.length) {
      return res
        .status(404)
        .json({ success: false, message: "No transaction details found." });
    }

    // Format the createdAt field for each transaction
    const formattedTransactions = transactionData.map(transaction => ({
      ...transaction,
      createdAt: formatDate(transaction.createdAt)
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

    // Find the customer and wallet details in one optimized query
    const walletData = await Wallet.aggregate([
      { $match: { customerId } }, // Filter by customer ID
      {
        $project: {
          customerId: 1,
          balance: 1,
          walletActivity: {
            $sortArray: { input: "$walletActivity", sortBy: { time: -1 } } // Sort activity by time DESC
          }
        }
      }
    ]);

    if (!walletData.length) {
      return res
        .status(404)
        .json({ success: false, message: "No wallet data found." });
    }

    const wallet = walletData[0];

    // Format balance as MM:00
    const formattedBalance = formatMinutesToFixed(wallet.balance);

    // Format walletActivity minutes as MM:00
    const formattedWalletActivity = wallet.walletActivity.map(activity => ({
      ...activity,
      minute: formatMinutesToFixed(activity.minute), // Format minutes
      time: formatDate(activity.time) // Format time
    }));

    // Return the wallet details
    res.status(200).json({
      message: "Wallet details fetched successfully.",
      data: {
        customerId: wallet.customerId,
        balance: formattedBalance,
        walletActivity: formattedWalletActivity
      }
    });
  } catch (error) {
    console.error("Error fetching wallet details:", error);
    next(error);
  }
};

