import NotaryService from "../../../../models/Admin/notaryServiceModels/notaryServiceModel.js";
import NotaryServicePricing from "../../../../models/Admin/notaryServiceModels/notaryServicePricingModel.js";
import mongoose from "mongoose";

export const addNotaryServicePricing = async (req, res, next) => {
  try {
    const { service, country, price, currency } = req.body;

    if (!service || !country || !price || !currency) {
      return res.status(400).json({ message: "All fields are required" });
    }
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
    const { serviceId } = req.params;
    const { country, price, currency } = req.body;

    console.log("Service ID: ", serviceId);

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const pricing = await NotaryServicePricing.findOne({
      service: serviceId
    }).select("service pricingTiers");

    console.log("Current Pricing: ", pricing);

    if (!pricing) {
      return res.status(404).json({ message: "Pricing item not found" });
    }

    if (!pricing.pricingTiers.has(country)) {
      return res
        .status(404)
        .json({ message: `No pricing found for country: ${country}` });
    }

    // Update the pricing for the given country
    pricing.pricingTiers.set(country, [price, currency]);

    await pricing.save();

    console.log("Updated Pricing: ", pricing);

    res.status(200).json({
      message: "Pricing updated successfully",
      service: pricing.service,
      country,
      price,
      currency
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
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
      [`pricingTiers.${country}`]: { $exists: true }
    });

    // Extract service IDs where price details exist
    const serviceIdsWithPrice = pricingEntries
      .filter(entry => entry.pricingTiers.get(country))
      .map(entry => entry.service);

    // Fetch services that have pricing details
    const addedList = await NotaryService.find({
      _id: { $in: serviceIdsWithPrice }
    })
      .sort({ serviceNo: 1 })
      .lean();

    // Fetch all services (since we need to return all if no prices exist)
    const allServices = await NotaryService.find().sort({ serviceNo: 1 }).lean();

    // If no services have pricing details, return all in notAddedList
    if (serviceIdsWithPrice.length === 0) {
      return res.status(200).json({
        message: "Service names fetched successfully",
        addedList: [],
        notAddedList: allServices.map(service => ({
          serviceId:service._id,
          serviceNameEnglish: service.ServiceNameEnglish,
          serviceNameArabic: service.ServiceNameArabic,
          serviceNo: service.serviceNo
        }))
      });
    }

    // Map addedList with pricing details
    const addedListWithPrices = addedList.map(service => {
      const pricingEntry = pricingEntries.find(
        entry => entry.service.toString() === service._id.toString()
      );
      const [price, currency] = pricingEntry.pricingTiers.get(country);
      return {
        serviceId:service._id,
        serviceNameEnglish: service.ServiceNameEnglish,
        serviceNameArabic: service.ServiceNameArabic,
        price,
        currency,
        serviceNo: service.serviceNo
      };
    });

    // Fetch services that do not have pricing details
    const notAddedList = await NotaryService.find({
      _id: { $nin: serviceIdsWithPrice }
    })
      .sort({ serviceNo: 1 })
      .lean();

    const notAddedListNames = notAddedList.map(service => ({
      serviceId:service._id,
      serviceNameEnglish: service.ServiceNameEnglish,
      serviceNameArabic: service.ServiceNameArabic,
      serviceNo: service.serviceNo
    }));

    res.status(200).json({
      message: "Service names fetched successfully",
      addedList: addedListWithPrices,
      notAddedList: notAddedListNames
    });
  } catch (error) {
    next(error);
  }
};
