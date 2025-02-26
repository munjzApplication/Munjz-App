import mongoose from "mongoose";
import Consultation from "../../../models/Customer/customerModels/transactionModel.js";
import CourtPayment from "../../../models/Customer/courtServiceModel/courtServicePayment.js";
import NotaryPayment from "../../../models/Customer/notaryServiceModel/notaryServicePayment.js";
import TranslationPayment from "../../../models/Customer/translationModel/translationPayment.js";
import CourtCase from "../../../models/Customer/courtServiceModel/courtServiceDetailsModel.js";
import NotaryCase from "../../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import TranslationCase from "../../../models/Customer/translationModel/translationDetails.js";
import { formatDatewithmonth } from "../../../helper/dateFormatter.js";

const fetchCaseIds = async customerId => {
  const [courtCases, notaryCases, translationCases] = await Promise.all([
    CourtCase.find({ customerId }).select("_id").lean(),
    NotaryCase.find({ customerId }).select("_id").lean(),
    TranslationCase.find({ customerId }).select("_id").lean()
  ]);


  return {
    courtCaseIds: courtCases.map(c => c._id),
    notaryCaseIds: notaryCases.map(c => c._id),
    translationCaseIds: translationCases.map(c => c._id)
  };
};

const fetchPayments = async caseIds => {
  const [
    courtPayments,
    notaryPayments,
    translationPayments,
    consultationPayments
  ] = await Promise.all([
    CourtPayment.find({ courtServiceCase: { $in: caseIds.courtCaseIds } })
      .select("amount paidCurrency paymentDate paymentStatus createdAt")
      .lean(),
    NotaryPayment.find({ notaryServiceCase: { $in: caseIds.notaryCaseIds } })
      .select("amount paidCurrency paymentDate paymentStatus createdAt")
      .lean(),
    TranslationPayment.find({
      translationCase: { $in: caseIds.translationCaseIds }
    })
      .select("amount paidCurrency paymentDate paymentStatus createdAt")
      .lean(),
    Consultation.find({ customerId: caseIds.customerId })
      .select("amountPaid currency paymentDate status createdAt")
      .lean()
  ]);
 

  return {
    courtPayments,
    notaryPayments,
    translationPayments,
    consultationPayments
  };
};

const formatTransactions = payments => {
  const {
    courtPayments,
    notaryPayments,
    translationPayments,
    consultationPayments
  } = payments;


  return [
    ...consultationPayments.map(payment => ({
      _id: payment._id,
      amount: payment.amountPaid,
      currency: payment.currency,
      paymentDate: formatDatewithmonth(
        payment.paymentDate || payment.createdAt
      ),
      status: payment.status,
      serviceType: "Consultation"
    })),
    ...courtPayments.map(payment => ({
      _id: payment._id,
      amount: payment.amount,
      currency: payment.paidCurrency,
      paymentDate: formatDatewithmonth(
        payment.paymentDate || payment.createdAt
      ),
      status: payment.paymentStatus,
      serviceType: "CourtService"
    })),
    ...notaryPayments.map(payment => ({
      _id: payment._id,
      amount: payment.amount,
      currency: payment.paidCurrency,
      paymentDate: formatDatewithmonth(
        payment.paymentDate || payment.createdAt
      ),
      status: payment.paymentStatus,
      serviceType: "NotaryService"
    })),
    ...translationPayments.map(payment => ({
      _id: payment._id,
      amount: payment.amount,
      currency: payment.paidCurrency,
      paymentDate: formatDatewithmonth(
        payment.paymentDate || payment.createdAt
      ),
      status: payment.paymentStatus,
      serviceType: "TranslationService"
    }))
  ];
};

export const getCustomerTransactions = async (req, res) => {
  try {
    const customerId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const caseIds = await fetchCaseIds(customerId);
    const payments = await fetchPayments({ ...caseIds, customerId });
    let transactions = formatTransactions(payments);

    transactions.sort(
      (a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)
    );

    const totalTransactions = transactions.length;
    const totalPages = Math.ceil(totalTransactions / limit);
    const paginatedTransactions = transactions.slice(
      (page - 1) * limit,
      page * limit
    );

    res.status(200).json({
      success: true,
      totalTransactions,
      currentPage: parseInt(page),
      totalPages,
      transactions: paginatedTransactions
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error fetching transactions",
        error: error.message
      });
  }
};
