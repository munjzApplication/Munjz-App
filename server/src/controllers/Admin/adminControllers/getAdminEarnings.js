import AdminEarnings from "../../../models/Admin/adminModels/earningsModel.js";
import ConsultantProfile from "../../../models/Consultant/User.js"; // Make sure this path is correct
import { formatDate } from "../../../helper/dateFormatter.js"; // Assuming formatDate function is correctly implemented

export const getAdminEarnings = async (req, res, next) => {
  try {
    // Fetch admin earnings and populate consultantId with Name from ConsultantProfile
    const adminEarnings = await AdminEarnings.find()
      .populate({
        path: "consultantId", // Reference the consultantId field
        model: "Consultant_Profile", // Ensure this matches the model name in ConsultantProfile
        select: "Name" // Only select the Name field from ConsultantProfile
      });

    // Format response to include consultantName and formatted createdAt date
    const earningsWithConsultantName = adminEarnings.map((earning) => ({
      consultantId: earning.consultantId._id,
      consultantName: earning.consultantId.Name || "Unknown", // Use "Unknown" if no name exists
      currency: earning.currency,
      totalEarnings: earning.totalEarnings,
      serviceName: earning.serviceName,
      reason: earning.reason,
      createdAt: formatDate(earning.createdAt), // Format the createdAt field
    }));

    // Send the response with earnings data
    res.status(200).json({
      success: true,
      message: "Admin earnings fetched successfully",
      data: earningsWithConsultantName,
    });
  } catch (error) {
    console.error("Error fetching admin earnings:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong!",
      error: error.message,
    });
    next(error);
  }
};
