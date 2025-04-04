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

    // Normalize and combine transactions
    const normalizedMainTransactions = transactions.map((transaction) => ({
      _id: transaction._id,
      amount: transaction.amountPaid,
      currency: transaction.currency,
      paymentDate: transaction.paymentDate,
      status: transaction.status,
      serviceType: transaction.serviceType
    }));

    const normalizedAdditionalTransactions = additionalTransactions.map((transaction) => ({
      _id: transaction._id,
      amount: transaction.amount,
      currency: transaction.paidCurrency,
      paymentDate: transaction.paymentDate,
      status: transaction.status,
      serviceType: transaction.serviceType
    }));

    const allTransactions = [...normalizedMainTransactions, ...normalizedAdditionalTransactions];

    // Sort by payment date descending
    allTransactions.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

    // Format transactions for frontend
    const formattedTransactions = allTransactions.map((transaction) => ({
      ...transaction,
      paymentDate: formatDatewithmonth(transaction.paymentDate)
    }));

    // Optional: Total amount calculation
    const totalAmount = allTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    res.status(200).json({
      message: "Transactions fetched successfully",
      transactions: formattedTransactions,
      totalAmount
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
