import DividendModel from "../../../../models/Admin/adminModels/dividendModel.js";

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
      message: "Pricing data for this country already exists.",
      data: dividendData
    });
  } catch (error) {
    next(error);
  }
};
export const createDividend = async (req, res, next) => {
  try {
    const { countryCode, rates } = req.body;

    const existingDividend = await DividendModel.findOne({ countryCode });

    if (existingDividend) {
      return res.status(400).json({
        success: false,
        message:
          "Dividend data for this country already exists. Use the update function."
      });
    }

    const dividendData = new DividendModel({
      countryCode,
      rates
    });

    await dividendData.save();

    res.status(201).json({
      success: true,
      message: "Dividend data successfully saved!",
      data: dividendData
    });
  } catch (error) {
    next(error);
  }
};
export const editDividend = async (req, res, next) => {
  try {
    const { countryCode } = req.params;
    const { rates } = req.body;
    const dividendData = await DividendModel.findOneAndUpdate(
      { countryCode },
      { $set: { rates } },
      { new: true, runValidators: true }
    );
    if (!dividendData) {
      return res.status(404).json({
        success: false,
        message: "Dividend data for this country not found."
      });
    }
    res.status(200).json({
      message: "Dividend data successfully updated!",
      data: dividendData
    });
  } catch (error) {
    next(error);
  }
};
