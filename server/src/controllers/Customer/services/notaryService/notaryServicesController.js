import NotaryServicePricing from "../../../../models/Admin/notaryServiceModels/notaryServicePricingModel.js";
import NotaryService from "../../../../models/Admin/notaryServiceModels/notaryServiceModel.js";

export const getServices = async (req, res, next) => {
  try {
    const { country } = req.params;

    const servicesWithPrices = await NotaryServicePricing.aggregate([
      {
        $match: {
          [`pricingTiers.${country}`]: { $exists: true }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $lookup: {
          from: "notaryservices",
          localField: "service",
          foreignField: "_id",
          as: "serviceDetails"
        }
      },
      {
        $unwind: "$serviceDetails"
      },
      {
        $project: {
          serviceId: "$serviceDetails._id",
          serviceNameEnglish: "$serviceDetails.ServiceNameEnglish",
          serviceNameArabic: "$serviceDetails.ServiceNameArabic",
          price: { $arrayElemAt: [`$pricingTiers.${country}`, 0] },
          currency: { $arrayElemAt: [`$pricingTiers.${country}`, 1] }
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
