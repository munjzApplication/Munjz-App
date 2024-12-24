import {
  getPayments,
  getDocuments
} from "../../../helper/customer/pendingDocsAndPayments.js";
export const getCustomerPending = async (req, res, next) => {
  try {
    // Get pending and paid payments and documents
    const payments = await getPayments();
    const documents = await getDocuments();

    // Generate notifications for both paid and pending statuses
    const notifications = [
      ...payments.paid.map(payment => ({
        message: `Payment for ${payment.type} of amount ${payment.amount} has been completed.`,
        data: payment
      })),
      ...payments.pending.map(payment => ({
        message: `Payment pending for ${payment.type}: Amount due ${payment.amount}.`,
        data: payment
      })),
      ...documents.map(doc => ({
        message:
          doc.status === "pending"
            ? `Document pending for ${doc.type}: Reason - ${doc.requestReason}`
            : `Document completed for ${doc.type}: ${doc.requestReason}`,
        data: doc
      }))
    ];

    
    res.status(200).json({
      success: true,
      message: "Customer notifications retrieved successfully",
      data: { notifications }
    });
  } catch (error) {
    console.error("Error retrieving customer notifications:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching customer notifications",
      error: error.message
    });
  }
};
