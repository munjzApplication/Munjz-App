import notaryServiceDetailsModel from "../../../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import notaryServicePayment from "../../../../models/Customer/notaryServiceModel/notaryServicePayment.js";
import notaryServiceDocument from "../../../../models/Customer/notaryServiceModel/notaryServiceDocument.js";
import { formatDate } from "../../../../helper/dateFormatter.js";
import mongoose from "mongoose";

export const getAllNotaryCases = async (req, res, next) => {
  try {
    let notaryCases = await notaryServiceDetailsModel.aggregate([
      {
        $lookup: {
          from: "customer_profiles",
          localField: "customerId",
          foreignField: "_id",
          as: "customer"
        }
      },
      {
        $unwind: "$customer"
      },
      {
        $project: {
          _id: 1,
          customerId: 1,
          notaryServiceID: 1,
          serviceName: 1,
          selectedServiceCountry: 1,
          caseDescription: 1,
          casePaymentStatus: 1,
          follower: 1,
          createdAt: 1,
          status: 1,
          customerName: "$customer.Name",
          customerPhone: "$customer.phoneNumber",
          customerProfile: "$customer.profilePhoto"
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    notaryCases = notaryCases.map(notaryCase => ({
      ...notaryCase,
      createdAt: formatDate(notaryCase.createdAt)
    }));

    res.status(200).json({
      message: "Notary cases fetched successfully",
      notaryCases
    });
  } catch (error) {
    next(error);
  }
};

export const getAllNotaryCasesWithID = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    let notaryCases = await notaryServiceDetailsModel.aggregate([
      {
        $match: { customerId: new mongoose.Types.ObjectId(customerId) } 
      },
      {
        $lookup: {
          from: "customer_profiles",
          localField: "customerId",
          foreignField: "_id",
          as: "customer"
        }
      },
      { $unwind: "$customer" },
      {
        $project: {
          _id: 1,
          customerId: 1,
          notaryServiceID: 1,
          serviceName: 1,
          selectedServiceCountry: 1,
          caseDescription: 1,
          casePaymentStatus: 1,
          follower: 1,
          createdAt: 1,
          status: 1,
          customerName: "$customer.Name",
          customerPhone: "$customer.phoneNumber",
          customerProfile: "$customer.profilePhoto"
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    notaryCases = notaryCases.map(notaryCase => ({
      ...notaryCase,
      createdAt: formatDate(notaryCase.createdAt)
    }));

    res.status(200).json({
      message: "Notary cases fetched successfully",
      notaryCases
    });
  } catch (error) {
    next(error);
  }
};
