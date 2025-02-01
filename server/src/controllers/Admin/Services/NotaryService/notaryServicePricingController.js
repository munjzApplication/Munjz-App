import NotaryService from "../../../../models/Admin/notaryServiceModels/notaryServiceModel.js";
import NotaryServicePricing from "../../../../models/Admin/notaryServiceModels/notaryServicePricingModel.js";

export const addNotaryServicePricing = async (req, res, next) => {
  try {
    const { service, country, price, currency } = req.body;

    const existingService = await NotaryService.findOne({ _id: service });

    if (!existingService) {
      return res.status(404).json({ message: "Notary service not found" });
    }

    let pricing = await NotaryServicePricing.findOne({ service });

    if (!pricing) {
      pricing = new NotaryServicePricing({
        service,
        pricingTiers: {}
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
      pricing
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
      pricing
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

export const getNotaryServicesByCountry = async (req, res, next) => {
  try {
    const { country } = req.params;

    console.log("Fetching service names for country:", country);

    // Find pricing entries that contain the specified country
    const pricingEntries = await NotaryServicePricing.find({
      [`pricingTiers.${country}`]: { $exists: true },
    });

    // If there are no pricing entries for the country, return early
    if (!pricingEntries.length) {
      return res.status(404).json({ message: "No services found for this country" });
    }

    // Extract service ids from the pricing entries (added list)
    const serviceIds = pricingEntries.map(entry => entry.service);

    // Fetch the NotaryService documents based on the serviceIds
    const services = await NotaryService.find({
      '_id': { $in: serviceIds }
    });

    // Create the "added list" with price and currency
    const addedList = services.map(service => {
      // Find the corresponding pricing entry for each service
      const pricingEntry = pricingEntries.find(entry => entry.service.toString() === service._id.toString());

      // Get the pricing for the specified country
      const [price, currency] = pricingEntry.pricingTiers.get(country);

      return {
        serviceNameEnglish: service.ServiceNameEnglish,
        price,
        currency,
      };
    });

    // Create the "not added list" with service names from NotaryService that do not have pricing for the country
    const notAddedList = await NotaryService.find({
      '_id': { $nin: serviceIds }
    });

    const notAddedListNames = notAddedList.map(service => service.ServiceNameEnglish);

    res.status(200).json({
      message: "Service names fetched successfully",
      addedList,
      notAddedList: notAddedListNames,
    });
  } catch (error) {
    next(error);
  }
};
