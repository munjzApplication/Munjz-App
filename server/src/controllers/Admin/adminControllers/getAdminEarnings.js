import AdminEarnings from "../../../models/Admin/adminModels/earningsModel.js";
import ConsultantProfile from "../../../models/Consultant/User.js";
import { formatDate } from "../../../helper/dateFormatter.js"; 

// Function to calculate total earnings
const calculateTotalEarnings = (earnings) => {
  return earnings.reduce((sum, earning) => sum + (earning.serviceAmount || 0), 0);
};

// Get all admin earnings (sorted in descending order)
export const getAdminEarnings = async (req, res, next) => {
  try {
    // Fetch earnings sorted in descending order by createdAt
    const adminEarnings = await AdminEarnings.aggregate([
      {
        $lookup: {
          from: "customer_profiles", // Collection name in MongoDB
          localField: "customerId",
          foreignField: "_id",
          as: "customerData",
        },
      },
      { $unwind: { path: "$customerData", preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1 } }, // Sorting in descending order
      {
        $project: {
          _id: 1,
          customerId: 1,
          customerName: { $ifNull: ["$customerData.Name", "Unknown"] },
          currency: 1,
          serviceAmount: 1,
          serviceName: 1,
          reason: 1,
          createdAt: 1,
        },
      },
    ]);

    // Calculate total earnings
    const totalEarnings = calculateTotalEarnings(adminEarnings);

    // Format createdAt
    const formattedEarnings = adminEarnings.map((earning) => ({
      ...earning,
      createdAt: formatDate(earning.createdAt),
    }));

    res.status(200).json({
      message: "Admin earnings fetched successfully",
      totalEarnings,
      data: formattedEarnings,
    });
  } catch (error) {
    console.error("Error fetching admin earnings:", error);
    res.status(500).json({ message: "Something went wrong!", error: error.message });
    next(error);
  }
};

// Get admin earnings filtered by serviceName
export const getAdminEarningsFilter = async (req, res, next) => {
  try {
    const { serviceName } = req.params;
    
    // Check if serviceName is provided
    const filter = serviceName ? { serviceName: { $regex: new RegExp(serviceName, "i") } } : {};

    // Fetch earnings based on serviceName filter, sorted in descending order
    const filteredEarnings = await AdminEarnings.aggregate([
      { $match: filter }, // Apply filter based on serviceName
      {
        $lookup: {
          from: "customer_profiles",
          localField: "customerId",
          foreignField: "_id",
          as: "customerData",
        },
      },
      { $unwind: { path: "$customerData", preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          _id: 1,
          customerId: 1,
          customerName: { $ifNull: ["$customerData.Name", "Unknown"] },
          currency: 1,
          serviceAmount: 1,
          serviceName: 1,
          reason: 1,
          createdAt: 1,
        },
      },
    ]);

    // Format createdAt
    const formattedEarnings = filteredEarnings.map((earning) => ({
      ...earning,
      createdAt: formatDate(earning.createdAt),
    }));

    res.status(200).json({
      message: "Filtered admin earnings fetched successfully",
      data: formattedEarnings,
    });
  } catch (error) {
    console.error("Error fetching filtered admin earnings:", error);
    res.status(500).json({ message: "Something went wrong!", error: error.message });
    next(error);
  }
};
