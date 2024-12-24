import {
  getPayments,
  getDocuments
} from "../../../helper/customer/pendingDocsAndPayments.js";

export const getCustomerPayments = async (req, res, next) => {
  try {
    const paymentData = await getPayments();

    res.status(200).json({
      success: true,
      message: "Customer payments retrieved successfully",
      data: paymentData
    });
  } catch (error) {
    console.error("Error retrieving customer payments:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching customer payments",
      error: error.message
    });
  }
};

export const getCustomerDocuments = async (req, res, next) => {
  try {
    const allDocuments = await getDocuments();

    res.status(200).json({
      success: true,
      message: "Customer documents retrieved successfully",
      data: allDocuments
    });
  } catch (error) {
    console.error("Error retrieving customer documents:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching customer documents",
      error: error.message
    });
  }
};
