import Pricing from "../../../models/Admin/adminModels/pricingModel.js";

export const getPricing = async (req, res, next) => {
  try {
    const { countryCode } = req.body;

    if (!countryCode) {
      return res.status(400).json({
        message: "Country code is required."
      });
    }

    // Check if pricing data exists for the given country
    let pricingData = await Pricing.findOne({ countryCode });

    // If not found, get the default UAE pricing
    if (!pricingData) {
      pricingData = await Pricing.findOne({ countryCode: "AE" });

      if (!pricingData) {
        return res.status(404).json({
          message: "Pricing data not found, including the default UAE pricing."
        });
      }

      return res.status(200).json({
        message:
          "Munjz has not added your country-specific pricing yet, so the amount is displayed in AED by default.",
        data: pricingData
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
