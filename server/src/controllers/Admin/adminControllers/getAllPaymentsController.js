import CustomerTransaction from "../../../models/Customer/customerModels/transaction.js";
import AdditionalPayment from "../../../models/Customer/customerModels/additionalTransaction.js";


export const getAllPayments = async (req, res, next) => {
  try {
    // Fetch payments directly from the models
    const successPayments = await CustomerTransaction.find({ status: "paid" });
    const pendingPayments = await AdditionalPayment.find({ status: "pending" });

    res.status(200).json({
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
  const { paymentId } = req.params;
  try {
    const deletedPayment = await Promise.any([
      CustomerTransaction.findByIdAndDelete(paymentId),
      AdditionalPayment.findByIdAndDelete(paymentId)
    ]);

    if (!deletedPayment) {
      return res.status(404).json({ success: false, message: "Payment not found." });
    }

    res.status(200).json({ success: true, message: "Payment deleted successfully." });
  } catch (error) {
    next(error);
  }
};

export const editPendingPayment = async (req, res, next) => {
  const { paymentId } = req.params;
  const { amount, markPaid } = req.body;

  try {
    let payment = await CustomerTransaction.findOne({ _id: paymentId, status: "pending" }) ||
      await AdditionalPayment.findOne({ _id: paymentId, status: "pending" });

    if (!payment) {
      return res.status(404).json({ success: false, message: "Pending payment not found." });
    }

    if (amount !== undefined) payment.amountPaid = amount;
    if (markPaid) {
      payment.status = "paid";
      payment.paymentDate = new Date();
    }

    await payment.save();

    res.status(200).json({
      success: true,
      message: markPaid ? "Payment marked as 'paid'." : "Amount updated successfully.",
      data: payment
    });
  } catch (error) {
    next(error);
  }
};
