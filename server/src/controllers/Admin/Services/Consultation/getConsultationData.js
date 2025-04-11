import consultationDetails from "../../../../models/Customer/consultationModel/consultationModel.js";
import {
  formatDate,
  formatMinutesToMMSS
} from "../../../../helper/dateFormatter.js";
import { getCurrencyFromCountryCode } from "../../../../helper/customer/currencyHelper.js";
import mongoose from "mongoose";

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
          consultantShare: 1,
          consultationRating: 1,
          stringFeedback: 1,
          consultantCountryCode: "$consultant.countryCode",
          CustomerId: "$customer._id",
          CustomerName: "$customer.Name",
          ConsultantId: "$consultant._id",
          ConsultantName: "$consultant.Name"
        }
      },

      { $sort: { consultationDate: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Format data and fetch consultant currency
    const formattedConsultationDatas = await Promise.all(
      consultationDatas.map(async ({ consultantCountryCode, ...item }) => {
        const consultantCurrency = await getCurrencyFromCountryCode(
          consultantCountryCode || ""
        );

        return {
          ...item,
          consultationDate: formatDate(item.consultationDate),
          consultationDuration: formatMinutesToMMSS(
            item.consultationDuration / 60
          ),
          consultantCurrency
        };
      })
    );

    res.status(200).json({
      message: "Consultation data retrieved successfully",
      totalConsultations,
      totalPages: Math.ceil(totalConsultations / limit),
      currentPage: page,
      data: formattedConsultationDatas
    });
  } catch (error) {
    console.error("Error fetching consultation data:", error);
    next(error);
  }
};

export const getConsultationDataById = async (req, res, next) => {
  try {
    const consultantId = new mongoose.Types.ObjectId(req.params.ConsultantId);

    const consultationDatas = await consultationDetails.aggregate([
      {
        $match: {
          consultantId: consultantId
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
          consultantShare: 1,
          consultationRating: 1,
          stringFeedback: 1,
          consultantCountryCode: "$consultant.countryCode",
          customerId: "$customer._id",
          customerName: "$customer.Name",
          consultantId: "$consultant._id",
          consultantName: "$consultant.Name",
          customerProfilePhoto: "$customer.profilePhoto"
        }
      },

      { $sort: { consultationDate: -1 } }
    ]);

    const formattedConsultationDatas = await Promise.all(
      consultationDatas.map(async ({ consultantCountryCode, ...item }) => {
        const consultantCurrency = await getCurrencyFromCountryCode(
          consultantCountryCode || ""
        );

        return {
          ...item,
          consultationDate: formatDate(item.consultationDate),
          consultationDuration: formatMinutesToMMSS(
            item.consultationDuration / 60
          ),
          consultantCurrency
        };
      })
    );

    res.status(200).json({
      message: "Consultation data retrieved successfully",
      data: formattedConsultationDatas
    });
  } catch (error) {
    console.error("Error fetching consultation data:", error);
    next(error);
  }
};


export const getConsultationReviews = async (req, res, next) => {
  try {
    const consultantId = new mongoose.Types.ObjectId(req.params.ConsultantId);

    const reviews = await consultationDetails.aggregate([
      {
        $match: {
          consultantId: new mongoose.Types.ObjectId(consultantId),
          consultationRating: { $exists: true, $ne: null }
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
          _id: 1,
          stringFeedback: 1,
          consultationRating: 1,
          customerName: "$customer.Name",
          customerProfilePhoto: "$customer.profilePhoto"
        }
      }
    ]);

    // Calculate average rating

    const totalRating = reviews.reduce((sum, review) => sum + (review.consultationRating || 0), 0);
    const averageRating = reviews.length > 0 ? (totalRating / reviews.length) : 0;


    res.status(200).json({
      message: "Consultation reviews retrieved successfully",
      averageRating: averageRating,
      data: reviews
    });

  } catch (error) {
    console.error("Error fetching consultation reviews:", error);
    next(error);
  }
};