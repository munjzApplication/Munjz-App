import DividendModel from "../../models/Admin/adminModels/dividendModel.js";
// commission
export const checkCountry = async (req, res, next) => {
  try {
    const { countryCode } = req.body;

    // Validate input
    if (!countryCode) {
      return res.status(400).json({
        message: "Country code is required."
      });
    }

    const dividendData = await DividendModel.findOne({ countryCode });

    if (!dividendData) {
      return res.status(200).json({
        message: "Pricing data for this country not found."
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved data.",
      data: dividendData
    });
  } catch (error) {
    next(error);
  }
};