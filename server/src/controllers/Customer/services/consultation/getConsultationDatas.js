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

    const customer = await customerProfile.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const consultationDatas = await consultationDetails.aggregate([
      { $match: { customerId: customerId } },
      {
        $lookup: {
          from: "consultant_profiles",
          localField: "consultantId",
          foreignField: "_id",
          as: "consultant"
        }
      },
      { $unwind: { path: "$consultant", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "consultant_personaldetails",
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
      consultationDuration: formatMinutesToMMSS(item.consultationDuration / 60)
    }));

    console.log(formattedConsultationDatas);

    if (formattedConsultationDatas.length === 0) {
      return res.status(404).json({ message: "No Consultation done" });
    }

    res.status(200).json({
      message: "Consultation data retrieved successfully",
      data: formattedConsultationDatas
    });
  } catch (error) {
    console.error("Error fetching consultation data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



export const getConsultationDataByDate = async (req, res, next) => {
  try {
    const { DateTime } = req.body; 
    const customerId = req.user._id;

    if (!DateTime) {
      return res.status(400).json({ message: "DateTime is required" });
    }
    const customer = await customerProfile.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Convert DateTime string to a Date object
    const providedDate = new Date(DateTime);

    // Extract only the date (ignore time)
    const startOfDay = new Date(providedDate.setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(providedDate.setUTCHours(23, 59, 59, 999));

    const consultationDatas = await consultationDetails.aggregate([
      {
        $match: {
          customerId: customerId,
          consultationDate: {
            $gte: startOfDay, // Start of the given date
            $lte: endOfDay,   // End of the given date
          }
        }
      },
      {
        $lookup: {
          from: "consultant_profiles",
          localField: "consultantId",
          foreignField: "_id",
          as: "consultant"
        }
      },
      { $unwind: { path: "$consultant", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "consultant_personaldetails",
          localField: "consultantId",
          foreignField: "consultantId",
          as: "personalDetails"
        }
      },
      { $unwind: { path: "$personalDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          consultationDuration: 1,
          consultationDate: 1,
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
      consultationDuration: formatMinutesToMMSS(item.consultationDuration / 60)
    }));

    if (formattedConsultationDatas.length === 0) {
      return res.status(404).json({ message: "No Consultation found for the given date" });
    }

    res.status(200).json({
      message: "Consultation data retrieved successfully",
      data: formattedConsultationDatas
    });
  } catch (error) {
    console.error("Error fetching consultation data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
