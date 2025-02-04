import consultationDetails from "../../../../models/Customer/consultationModel/consultationModel.js";
import ConsultantProfile from "../../../../models/Consultant/User.js";
import PersonalDetails from "../../../../models/Consultant/personalDetails.js";
import customerProfile from "../../../../models/Customer/customerModels/customerModel.js";
import mongoose from "mongoose";
import {
  formatDate,
  formatMinutesToMMSS
} from "../../../../helper/dateFormatter.js";
export const getConsultationDatas = async (req, res, next) => {
  try {
    const customerId = req.user._id;
    console.log("Customer ID:", customerId);

    // Check if the customer exists
    const customer = await customerProfile.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Use aggregation to join consultation details, consultant profiles, and personal details
    const consultationDatas = await consultationDetails.aggregate([
      { $match: { customerId: customerId } },
      {
        $lookup: {
          from: "consultant_profiles", // Use the correct collection name
          localField: "consultantId",
          foreignField: "_id",
          as: "consultant"
        }
      },
      { $unwind: { path: "$consultant", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "consultant_personaldetails", // Use the correct collection name
          localField: "consultantId",
          foreignField: "consultantId",
          as: "personalDetails"
        }
      },
      {
        $unwind: { path: "$personalDetails", preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          consultationDuration: 1,
          consultationDate: "$consultationDate",
          ConsultantName: "$consultant.Name",
          ConsultantEmail: "$consultant.email",
          ConsultantProfilePic: {
            $ifNull: ["$personalDetails.profilePicture", null]
          },
          ConsultantIsBlocked: "$consultant.isBlocked"
        }
      }
    ]);

    const formattedConsultationDatas = consultationDatas.map(item => ({
      ...item,
      consultationDuration: formatMinutesToMMSS(item.consultationDuration / 60) // Convert seconds to minutes before formatting
    }));

    console.log(formattedConsultationDatas); // Check the formatted output

    if (formattedConsultationDatas.length === 0) {
      return res.status(404).json({ message: "No Consultation done" });
    }

    // Send response with success message
    res.status(200).json({
      message: "Consultation data retrieved successfully",
      data: formattedConsultationDatas
    });
  } catch (error) {
    console.error("Error fetching consultation data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
