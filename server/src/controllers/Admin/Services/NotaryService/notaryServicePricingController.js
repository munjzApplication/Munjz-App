import NotaryService from "../../../../models/Admin/notaryServiceModels/notaryServiceModel.js";
import NotaryServicePricing from "../../../../models/Admin/notaryServiceModels/notaryServicePricingModel.js";

export const addNotaryServicePricing = async (req, res, next) => {
  try {
    const { service, country, price, currency } = req.body;

    const existingService = await NotaryService.findById(service);

    if (!existingService) {
      return res.status(404).json({ message: "Notary service not found" });
    }

    let pricing = await NotaryServicePricing.findOne({ service });

    if (!pricing) {
      pricing = new NotaryServicePricing({
        service,
        pricingTiers: {},
      });
    }

    if (pricing.pricingTiers.has(country)) {
      return res
        .status(400)
        .json({ message: "Pricing for this country already exists" });
    }

    pricing.pricingTiers.set(country, [price, currency]);

    await pricing.save();

    res.status(201).json({
      message: "New country pricing added successfully",
      pricing,
    });
  } catch (error) {
    next(error);
  }
};

export const getNotaryServicePricing = async (req, res, next) => {
  try {
    const { service } = req.params;

    const pricing = await NotaryServicePricing.findOne({ service }).populate(
      "service"
    );

    if (!pricing) {
      return res
        .status(404)
        .json({ message: "Pricing not found for this notary service" });
    }

    res.status(200).json({ pricing });
  } catch (error) {
    next(error);
  }
};

export const updateNotaryServicePricing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { country, price, currency } = req.body;

    const pricing = await NotaryServicePricing.findById(id);

    if (!pricing) {
      return res.status(404).json({ message: "Pricing not found" });
    }

    pricing.pricingTiers.set(country, [price, currency]);

    await pricing.save();

    res.status(200).json({
      message: "Pricing updated successfully",
      pricing,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotaryServicePricing = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedPricing = await NotaryServicePricing.findByIdAndDelete(id);

    if (!deletedPricing) {
      return res.status(404).json({ message: "Pricing not found" });
    }

    res.status(200).json({ message: "Pricing deleted successfully" });
  } catch (error) {
    next(error);
  }
};
