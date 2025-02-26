import CourtServicePricing from "../../../../models/Admin/courtServiceModels/courtServicePricingModel.js";
import CourtService from "../../../../models/Admin/courtServiceModels/courtServiceModel.js";
export const getServices = async (req, res, next) => {
  try {
    const { country } = req.params;
    const servicesWithPrices = await CourtServicePricing.aggregate([
      {
        $match: {
          [`pricingTiers.${country}`]: { $exists: true }
        }
      },
      {
        $lookup: {
          from: "courtservices",
          localField: "service",
          foreignField: "_id",
          as: "serviceDetails"
        }
      },
      {
        $unwind: "$serviceDetails"
      },
      {
        $addFields: {
          priceInfo: { $objectToArray: "$pricingTiers" }
        }
      },
      {
        $unwind: "$priceInfo"
      },
      {
        $match: {
          "priceInfo.k": country
        }
      },
      {
        $project: {
          serviceId: "$serviceDetails._id",
          serviceNameEnglish: "$serviceDetails.ServiceNameEnglish",
          serviceNameArabic: "$serviceDetails.ServiceNameArabic",
          price: "$priceInfo.v.price",
          currency: "$priceInfo.v.currency"
        }
      }
    ]);
    

    res.status(200).json({
      message: "Service names fetched successfully",
      services: servicesWithPrices
    });
  } catch (error) {
    next(error);
  }
};