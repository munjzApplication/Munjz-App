import AdminEarnings from "../../../models/Admin/adminModels/earningsModel.js";
import ConsultantProfile from "../../../models/Consultant/User.js"; // Make sure this path is correct
import { formatDate } from "../../../helper/dateFormatter.js"; // Assuming formatDate function is correctly implemented

// Function to calculate total earnings
const calculateTotalEarnings = (earnings) => {
  return earnings.reduce((sum, earning) => sum + (earning.serviceAmount || 0), 0);
};

export const getAdminEarnings = async (req, res, next) => {
  try {
    // Fetch admin earnings and populate customerId with Name from customerProfile
    const adminEarnings = await AdminEarnings.find()
      .populate({
        path: "customerId", // Reference the customerId field
        model: "Customer_Profile", // Ensure this matches the model name in customerProfile
        select: "Name", // Only select the Name field from customerProfile
      });

    // Calculate total earnings using the function
    const totalEarnings = calculateTotalEarnings(adminEarnings);

    // Format response to include customerName and formatted createdAt date
    const earningsWithCustomerName = adminEarnings.map((earning) => ({
      customerId: earning.customerId?._id,
      customerName: earning.customerId?.Name || "Unknown", // Use "Unknown" if no name exists
      currency: earning.currency,
      serviceAmount: earning.serviceAmount,
      serviceName: earning.serviceName,
      reason: earning.reason,
      createdAt: formatDate(earning.createdAt), // Format the createdAt field
    }));

    // Send the response with earnings data and total earnings sum
    res.status(200).json({
      message: "Admin earnings fetched successfully",
      totalEarnings, // Include total earnings in response
      data: earningsWithCustomerName,
    });
  } catch (error) {
    console.error("Error fetching admin earnings:", error);
    res.status(500).json({
      message: "Something went wrong!",
      error: error.message,
    });
    next(error);
  }
};
