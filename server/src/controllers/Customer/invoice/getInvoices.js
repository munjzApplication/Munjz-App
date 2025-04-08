import CustomerTransaction from "../../../models/Customer/customerModels/transaction.js";
import CustomerAdditionalTransaction from "../../../models/Customer/customerModels/additionalTransaction.js";
export const getCustomerInvoices = async (req, res, next) => {
  try {
    const customerId = req.user._id;

    const invoices = await CustomerTransaction.find({ customerId });
    const additionalInvoices = await CustomerAdditionalTransaction.find({
      customerId
    });


    const allInvoices = [...invoices, ...additionalInvoices];
    allInvoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      message: "Customer invoices retrieved successfully",
      data: allInvoices
    });
  } catch (error) {
    next(error);
  }
};
