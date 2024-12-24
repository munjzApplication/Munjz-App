import CourtService from "../../../../models/Admin/courtServiceModels/courtServiceModel.js";
import CourtServicePricing from "../../../../models/Admin/courtServiceModels/courtServicePricingModel.js";

export const addCourtServicePricing = async (req, res, next) => {
  try {
    const { serviceId, country, price, currency } = req.body;

    const service = await CourtService.findById(serviceId);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    let pricing = await CourtServicePricing.findOne({ serviceId });

    if (!pricing) {
      pricing = new CourtServicePricing({
        serviceId,
        BigPricingMaps: {}
      });
    }

    if (pricing.BigPricingMaps.has(country)) {
      return res
        .status(400)
        .json({ message: "Pricing for this country already exists" });
    }

    pricing.BigPricingMaps.set(country, [price, currency]);

    await pricing.save();

    res.status(201).json({
      message: "New country pricing added successfully",
      pricing
    });
  } catch (error) {
    next(error);
  }
};

export const getCourtServicePricing = async (req, res, next) => {
  try {
    const { serviceId } = req.params;

    const pricing = await CourtServicePricing.findOne({ serviceId }).populate(
      "serviceId"
    );

    if (!pricing) {
      return res
        .status(404)
        .json({ message: "Pricing not found for this service" });
    }

    res.status(200).json({ pricing });
  } catch (error) {
    next(error);
  }
};

export const updateCourtServicePricing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { country, price, currency } = req.body;

    const pricing = await CourtServicePricing.findById(id);

    if (!pricing) {
      return res.status(404).json({ message: "Pricing not found" });
    }

    pricing.BigPricingMaps[country] = [price, currency];

    await pricing.save();

    res.status(200).json({
      message: "Pricing updated successfully",
      pricing
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCourtServicePricing = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedPricing = await CourtServicePricing.findByIdAndDelete(id);

    if (!deletedPricing) {
      return res.status(404).json({ message: "Pricing not found" });
    }

    res.status(200).json({ message: "Pricing deleted successfully" });
  } catch (error) {
    next(error);
  }
};
