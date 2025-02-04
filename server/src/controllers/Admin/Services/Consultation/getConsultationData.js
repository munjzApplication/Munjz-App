import consultationDetails from "../../../../models/Customer/consultationModel/consultationModel.js";
import { formatMinutesToMMSS } from "../../../../helper/dateFormatter.js";
export const getAllConsultationDatas = async (req, res, next) => {
  try {
    const consultationDatas = await consultationDetails.aggregate([
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
        $lookup: {
          from: "consultant_profiles",
          localField: "consultantId",
          foreignField: "_id",
          as: "consultant"
        }
      },
      { $unwind: { path: "$consultant", preserveNullAndEmptyArrays: true } },

      {
        $project: {
          _id: 1,
          consultationDate: 1,
          consultationDuration: 1,
          totalAmount: 1, // Assuming this field exists in consultationDetails
          CustomerName: "$customer.Name",
          ConsultantName: "$consultant.Name"
        }
      }
    ]);

    const formattedConsultationDatas = consultationDatas.map(item => ({
      ...item,
      consultationDuration: formatMinutesToMMSS(item.consultationDuration / 60)
    }));
    const totalConsultations = formattedConsultationDatas.length; 

    if (totalConsultations === 0) {
      return res.status(404).json({ message: "No consultation records found" });
    }

    res.status(200).json({
      message: "All consultation data retrieved successfully",
      totalConsultations, 
      data: formattedConsultationDatas
    });
  } catch (error) {
    console.error("Error fetching consultation data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
