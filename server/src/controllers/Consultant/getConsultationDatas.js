import consultationDetails from "../../models/Customer/consultationModel/consultationModel.js";
import ConsultantProfile from "../../models/Consultant/ProfileModel/User.js";
import { formatMinutesToMMSS } from "../../helper/dateFormatter.js";
import { io } from "../../socket/socketController.js";


export const getConsultationDetails = async (req, res, next) => {
  try {
    const consultantId = req.user._id;

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

export const getConsultationDataByDate = async (req, res, next) => {
  try {
    const { DateTime } = req.body; 
    const consultantId = req.user._id;

    if (!DateTime) {
      return res.status(400).json({ message: "DateTime is required" });
    }

    const consultant = await ConsultantProfile.findById(consultantId);
    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }

    // Convert DateTime string to a Date object
    const providedDate = new Date(DateTime);

    // Extract only the date (YYYY-MM-DD) in UTC
    const startOfDay = new Date(
      Date.UTC(
        providedDate.getUTCFullYear(),
        providedDate.getUTCMonth(),
        providedDate.getUTCDate(),
        0,
        0,
        0,
        0
      )
    );

    const endOfDay = new Date(
      Date.UTC(
        providedDate.getUTCFullYear(),
        providedDate.getUTCMonth(),
        providedDate.getUTCDate(),
        23,
        59,
        59,
        999
      )
    );

    const consultationDatas = await consultationDetails.aggregate([
      {
        $match: {
          consultantId: consultantId,
          consultationDate: {
            $gte: startOfDay, // Start of the given date
            $lte: endOfDay // End of the given date
          }
        }
      },
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
          consultantShare: 1,
          CustomerId: "$customer._id",
          CustomerName: "$customer.Name",
          CustomerEmail: "$customer.email",
          CustomerProfilePic: "$customer.profilePhoto",
          consultationHours: {
            $dateToString: {
              format: "%H:%M",
              date: "$consultationDate"
            }
          }
        }
      }
    ]);

   
    const formattedConsultationDatas = consultationDatas.map(item => ({
      ...item,
      consultationDuration: formatMinutesToMMSS(item.consultationDuration / 60) // Assuming it's in seconds
    }));

    const consultantNamespace = io.of("/consultant");
    consultantNamespace.to(consultantId.toString()).emit("consultant-consultation-datas", {
      message: "Consultation data retrieved successfully",
      consultantId: consultantId,
      data: formattedConsultationDatas
    });

    return res.status(200).json({
      message: "Consultation data retrieved successfully",
      consultantId: consultantId,
      data: formattedConsultationDatas
    });
  } catch (error) {
    console.error("Error fetching consultation data:", error);
    next(error);
  }
};
