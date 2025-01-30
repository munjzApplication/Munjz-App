import Transaction from "../../../models/Customer/customerModels/transactionModel.js";
import CustomerProfile from "../../../models/Customer/customerModels/customerModel.js";
import Wallet from "../../../models/Customer/customerModels/walletModel.js";
import { formatDate } from "../../../helper/dateFormatter.js";

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

    // Fetch transaction details
    const transactionData = await Transaction.find({ customerId }).select(
      "currency amountPaid status createdAt"
    );
    if (!transactionData.length) {
      return res
        .status(404)
        .json({ success: false, message: "No transaction details found." });
    }

    // Format the createdAt field for each transaction
    const formattedTransactions = transactionData.map(transaction => ({
      ...transaction.toObject(),
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

    // Find the customer details
    const customer = await CustomerProfile.findById(customerId);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found." });
    }

    // Find the wallet details for the customer
    const walletData = await Wallet.findOne({ customerId }).select(
      "customerId balance"
    );
    if (!walletData) {
      return res
        .status(404)
        .json({ success: false, message: "No wallet data found." });
    }

    // Return the wallet details
    res.status(200).json({
      message: "Wallet details fetched successfully.",
      data: walletData
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
