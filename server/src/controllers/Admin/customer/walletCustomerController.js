import mongoose from "mongoose";
import customerProfile from "../../../models/Customer/customerModels/customerModel.js";
import consultationDetails from "../../../models/Customer/consultationModel/consultationModel.js";
import walletDetails from "../../../models/Customer/customerModels/walletModel.js";
import notaryService from "../../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import courtService from "../../../models/Customer/courtServiceModel/courtServiceDetailsModel.js";
import translationService from "../../../models/Customer/translationModel/translationDetails.js";
import {
  formatDate,
  formatMinutesToMMSS
} from "../../../helper/dateFormatter.js";

export const getWalletDetails = async (req, res, next) => {
  const { customerId, actionType } = req.body;

  try {
    const customer = await customerProfile.findById(customerId).lean();
    const wallet = await walletDetails.findOne({ customerId }).lean();

    let services = [];

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (actionType === "ALL" || actionType === "CONSULTATION") {
      const consultations = await consultationDetails.aggregate([
        { $match: { customerId: new mongoose.Types.ObjectId(customerId) } },
        { $sort: { consultationDate: -1 } },
        {
          $lookup: {
            from: "consultant_profiles",
            localField: "consultantId",
            foreignField: "_id",
            as: "consultant"
          }
        },
        {
          $unwind: {
            path: "$consultant",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            consultantName: "$consultant.Name",
            consultationDate: 1,
            consultationDuration: 1,
            
          }
        },
        { $skip: skip },
        { $limit: limit }
      ]);

      services = [
        ...services,
        ...consultations.map(service => ({
          consultantName: service.consultantName || "Unknown",
          consultationDate: formatDate(service.consultationDate),
          consultationDuration: formatMinutesToMMSS(service.consultationDuration),
          consultationRate: service.consultationRating,
          serviceType: "CONSULTATION"
        }))
      ];
    }

    if (actionType === "ALL" || actionType === "NOTARYSERVICE") {
      const notaryServices = await notaryService
        .find({ customerId })
        .skip(skip)
        .limit(limit)
        .lean();

      services = [
        ...services,
        ...notaryServices.map(service => ({
          ...service,
          serviceType: "NOTARYSERVICE"
        }))
      ];
    }

    if (actionType === "ALL" || actionType === "COURTSERVICE") {
      const courtServices = await courtService
        .find({ customerId })
        .skip(skip)
        .limit(limit)
        .lean();

      services = [
        ...services,
        ...courtServices.map(service => ({
          ...service,
          serviceType: "COURTSERVICE"
        }))
      ];
    }

    if (actionType === "ALL" || actionType === "TRANSLATIONSERVICE") {
      const translationServices = await translationService
        .find({ customerId })
        .skip(skip)
        .limit(limit)
        .lean();

      services = [
        ...services,
        ...translationServices.map(service => ({
          ...service,
          serviceType: "TRANSLATIONSERVICE"
        }))
      ];
    }

    return res.status(200).json({
      customer: {
        name: customer.Name,
        email: customer.email,
        walletBalance: wallet?.balance || 0
      },
      services
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
