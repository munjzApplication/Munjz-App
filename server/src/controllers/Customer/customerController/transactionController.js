import mongoose from "mongoose";
import CustomerTransaction from "../../../models/Customer/customerModels/transaction.js";
import CustomerAdditionalTransaction from "../../../models/Customer/customerModels/additionalTransaction.js";
import { formatDatewithmonth } from "../../../helper/dateFormatter.js";

export const getCustomerTransactions = async (req, res) => {
  try {
    const customerId = req.user._id;

    // Fetch transactions from both collections
    const transactions = await CustomerTransaction.find({ customerId });
    const additionalTransactions = await CustomerAdditionalTransaction.find({ customerId });

    // Combine transactions
    const allTransactions = [...transactions, ...additionalTransactions];

    // Sort transactions by paymentDate in descending order
    allTransactions.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

    // Format transactions
    const formattedTransactions = allTransactions.map((transaction) => ({
      _id: transaction._id,
      amount: transaction.amountPaid,
      currency: transaction.currency,
      paymentDate: formatDatewithmonth(transaction.paymentDate),
      status: transaction.status,
      serviceType: transaction.serviceType
    }));

    res.status(200).json({
      message: "Transactions fetched successfully",
      transactions: formattedTransactions
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching transactions",
      error: error.message
    });
  }
};
