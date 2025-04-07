import customerTransaction from '../../../models/Customer/customerModels/transaction.js';
import customerAdditionalTransaction from '../../../models/Customer/customerModels/additionalTransaction.js';
import customer from '../../../models/Customer/customerModels/customerModel.js';

export const getPaymentDetails = async (req, res, next) => {
    try {

        const paidTransaction = await customerTransaction.find({ status: "paid" }).lean();
        const paidAdditionalTransactions = await customerAdditionalTransaction.find({ status: "paid" }).lean();

        const paidTransactions = [...paidTransaction, ...paidAdditionalTransactions];

        const pendingTransactions = await customerAdditionalTransaction.find({ status: "pending" }).lean();

        return res.status(200).json({
            message: " Payment details fetched successfully",
            paidTransactions,
            pendingTransactions
        });


    } catch (error) {
        next(error);
    }
}

export const editPaymentDetails = async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const { serviceType, amount } = req.body;

        // Find the payment document
        const payment = await customerAdditionalTransaction.findOne({
            caseId,
            status: "pending"
        });
        if (!payment) return res.status(404).json({ message: "Invalid case ID" });

        // Optional: validate customer exists (if needed)
        const customerDetails = await customer.findById(payment.customerId).lean();
        if (!customerDetails) return res.status(404).json({ message: "Invalid customer ID" });

        // Update fields
        payment.serviceType = serviceType;
        payment.amount = amount;

        await payment.save();

        return res.status(200).json({
            message: "Payment details updated successfully",
            data: payment
        });
    } catch (error) {
        next(error);
    }
};


export const deletePaymentDetails = async (req, res, next) => {
    try {
        const { caseId } = req.params;

        const deletedPayment = await customerAdditionalTransaction.findOneAndDelete({
            status: "pending",
            caseId: caseId
        });
        
        if (!deletedPayment) {
            return res.status(404).json({ message: "Payment not found or already deleted" });
        }

        return res.status(200).json({
            message: "Payment deleted successfully",
            data: deletedPayment
        });
    } catch (error) {
        next(error); // or res.status(500).json({ message: error.message });
    }
};