import consultationDetails from "../../models/Customer/consultationModel/consultationModel.js";
import ConsultantProfile from "../../models/Consultant/User.js";
import customerProfile from "../../models/Customer/customerModels/customerModel.js";
import mongoose from "mongoose";
import { formatDate, formatMinutesToMMSS } from "../../helper/dateFormatter.js";

export const getConsultationDetails = async (req, res, next) => {
  try {
    const consultantId = req.user._id;
    console.log("Consultant ID:", consultantId);

    const consultant = await ConsultantProfile.findById(consultantId);
    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }

    const consultationDatas = await consultationDetails.aggregate([
        { $match: { consultantId: consultantId } },
        {
          $lookup: {
            from: "customer_profiles",
            localField: "customerId",
            foreignField: "_id",
            as: "customer"
          }
        },
        { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            consultationDuration: 1,
            consultationDate: 1,
            CustomerName: "$customer.Name",
            CustomerEmail: "$customer.email",
            CustomerProfilePic: "$customer.profilePhoto"
          }
        }
      ]);
      console.log("Aggregated Consultation Data:", consultationDatas);

    console.log("Aggregated Consultation Data:", consultationDatas);

    const formattedConsultationDatas = consultationDatas.map(item => ({
        ...item,
        consultationDuration: formatMinutesToMMSS(item.consultationDuration / 60)
      }));

    if (formattedConsultationDatas.length === 0) {
      return res.status(404).json({ message: "No consultations found" });
    }

    res.status(200).json({
      message: "Consultation data retrieved successfully",
      data: formattedConsultationDatas
    });
  } catch (error) {
    console.error("Error fetching consultation and consultant data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
