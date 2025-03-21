import mongoose from "mongoose";
import CustomerTransaction from "../../../models/Customer/customerModels/transaction.js";
import { formatDatewithmonth } from "../../../helper/dateFormatter.js";

export const getCustomerTransactions = async (req, res) => {
  try {
    const customerId = req.user._id;
    const transactions = await CustomerTransaction.find({ customerId }).sort({ paymentDate: -1 });

    const formattedTransactions = transactions.map((transaction) => ({
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
