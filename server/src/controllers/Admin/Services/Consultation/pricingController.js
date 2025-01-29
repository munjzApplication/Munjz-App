import PricingModel from "../../../../models/Admin/adminModels/pricingModel.js";

export const checkCountry = async (req, res, next) => {
  try {
    const { countryCode } = req.body;

    // Validate input
    if (!countryCode) {
      return res.status(400).json({
        message: "Country code is required."
      });
    }

    // Check if country exists in PricingModel
    const pricingData = await PricingModel.findOne({ countryCode });

    if (!pricingData) {
      return res.status(200).json({
        message: "Pricing data for this country not found."
      });
    }

    return res.status(200).json({
      message: "Pricing data for this country already exists."
    });
  } catch (error) {
    next(error);
  }
};

export const createPricing = async (req, res, next) => {
  try {
    const { countryCode, parses } = req.body;

    const existingPricing = await PricingModel.findOne({ countryCode });

    if (existingPricing) {
      return res.status(400).json({
        success: false,
        message:
          "Pricing data for this country already exists. Use edit function to update."
      });
    }

    const pricingData = new PricingModel({
      countryCode,
      parses
    });

    await pricingData.save();

    res.status(201).json({
      success: true,
      message: "Pricing data successfully saved!",
      data: pricingData
    });
  } catch (error) {
    next(error);
  }
};

export const editPricing = async (req, res, next) => {
  try {
    const { countryCode } = req.params;
    const { parses } = req.body;

    const pricingData = await PricingModel.findOne({ countryCode });

    if (!pricingData) {
      return res.status(404).json({
        success: false,
        message: "Pricing data for this country not found."
      });
    }

    // Update parses
    pricingData.parses = parses;

    await pricingData.save();

    res.status(200).json({
      success: true,
      message: "Pricing data successfully updated!",
      data: pricingData
    });
  } catch (error) {
    next(error);
  }
};
