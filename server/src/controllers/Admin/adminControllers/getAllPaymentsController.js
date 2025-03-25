import CourtPayment from "../../../models/Customer/courtServiceModel/courtServicePayment.js";
import CourtServiceAdditionalPayment from "../../../models/Customer/courtServiceModel/courtServiceAdditionalPayment.js";
import NotaryServicePayment from "../../../models/Customer/notaryServiceModel/notaryServicePayment.js";
import NotaryServiceAdditionalPayment from "../../../models/Customer/notaryServiceModel/notaryServiceAdditionalPayment.js";
import TranslationPayment from "../../../models/Customer/translationModel/translationPayment.js";
import TranslationAdditionalPayments from "../../../models/Customer/translationModel/translationAdditionalPayments.js";
import { fetchAndCategorizePayments } from "../../../helper/admin/getAllPaymentsHelper.js";

export const getAllPayments = async (req, res, next) => {
  try {
    // List of models to aggregate
    const models = [
      { name: "CourtPayment", model: CourtPayment },
      {
        name: "CourtServiceAdditionalPayment",
        model: CourtServiceAdditionalPayment
      },
      { name: "NotaryServicePayment", model: NotaryServicePayment },
      {
        name: "NotaryServiceAdditionalPayment",
        model: NotaryServiceAdditionalPayment
      },
      { name: "TranslationPayment", model: TranslationPayment },
      {
        name: "TranslationAdditionalPayments",
        model: TranslationAdditionalPayments
      }
    ];

    // Fetch and categorize payments using the helper function
    const {
      successPayments,
      pendingPayments
    } = await fetchAndCategorizePayments(models);

    // Send a structured response
    res.status(200).json({
      success: true,
      data: {
        successPayments,
        pendingPayments
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deletePendingPayment = async (req, res, next) => {
  const { consultantId } = req.params;
  try {
    // Attempt to delete the record from both models (Court and Notary)
    const deletedPayment =
      (await CourtServiceAdditionalPayment.findByIdAndDelete(consultantId)) ||
      (await NotaryServiceAdditionalPayment.findByIdAndDelete(consultantId)) ||
      (await TranslationAdditionalPayments.findByIdAndDelete(consultantId));

    if (!deletedPayment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found." });
    }

    res
      .status(200)
      .json({ success: true, message: "Payment deleted successfully." });
  } catch (error) {
    next(error);
  }
};

export const editPendingPayment = async (req, res, next) => {
  const { consultantId } = req.params;
  const { amount, markPaid } = req.body;

  try {
    let payment = null;
    let serviceName = "";

    // Check explicitly in each service by `caseId`
    if (!payment) {
      payment = await CourtServiceAdditionalPayment.findOne({ caseId: consultantId });
      if (payment) serviceName = "Court Service";
    }
    if (!payment) {
      payment = await NotaryServiceAdditionalPayment.findOne({ caseId: consultantId });
      if (payment) serviceName = "Notary Service";
    }
    if (!payment) {
      payment = await TranslationAdditionalPayments.findOne({ caseId: consultantId });
      if (payment) serviceName = "Translation Service";
    }

    // If payment not found in any service
    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found." });
    }

    // Validate the current payment status
    if (payment.paymentStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Only pending payments can be updated. Current status: ${payment.paymentStatus}`
      });
    }

    // If the amount is provided, update the amount
    if (amount !== undefined) {
      payment.amount = amount;
    }

    // If markPaid is true, change the payment status to paid
    if (markPaid) {
      payment.paymentStatus = "paid";
      payment.paidAt = new Date();
    }

    await payment.save();

    res.status(200).json({
      success: true,
      message: markPaid
        ? `Payment marked as 'paid' for the ${serviceName}.`
        : `Amount updated for the ${serviceName}.`,
      data: payment
    });
  } catch (error) {
    console.error("Error updating payment:", error.message);
    next(error);
  }
};
