import consultationDetails from "../../../../models/Customer/consultationModel/consultationModel.js";
import { formatDate, formatMinutesToMMSS } from "../../../../helper/dateFormatter.js";

export const getAllConsultationDatas = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const totalConsultations = await consultationDetails.countDocuments(); 

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
          CustomerId: "$customer._id",
          CustomerName: "$customer.Name",
          ConsultantId: "$consultant._id",
          ConsultantName: "$consultant.Name"
        }
      },

      { $sort: { consultationDate: -1 } },
      { $skip: skip }, // Skip records for pagination
      { $limit: limit } // Limit results per page
    ]);

    const formattedConsultationDatas = consultationDatas.map(item => ({
      ...item,
      consultationDate: formatDate(item.consultationDate), 
      consultationDuration: formatMinutesToMMSS(item.consultationDuration / 60)
    }));

    res.status(200).json({
      message: "Consultation data retrieved successfully",
      totalConsultations,
      totalPages: Math.ceil(totalConsultations / limit),
      currentPage: page,
      data: formattedConsultationDatas
    });
  } catch (error) {
    console.error("Error fetching consultation data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
