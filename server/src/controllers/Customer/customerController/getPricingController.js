import Pricing from "../../../models/Admin/adminModels/pricingModel.js";

export const getPricing = async (req, res, next) => {
  try {
    const { countryCode } = req.body;
    if (!countryCode) {
      return res.status(400).json({
        message: "Country code is required"
      });
    }

    const pricingData = await Pricing.findOne({ countryCode });
    if (!pricingData) {
      return res.status(200).json({
        message: "Pricing data for this country not found."
      });
    }
    res.status(200).json({
      message: "Pricing data fetched successfully!",
      data: pricingData
    });
  } catch (error) {
    next(error);
  }
};
