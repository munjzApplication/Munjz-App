import CourtService from "../../../../models/Admin/courtServiceModels/courtServiceModel.js";
import CourtServicePricing from "../../../../models/Admin/courtServiceModels/courtServicePricingModel.js";
import mongoose from "mongoose";

export const addCourtServicePricing = async (req, res, next) => {
  try {
    const { service, country, price, currency } = req.body;

    const existingService = await CourtService.findOne({ _id: service });

    if (!existingService) {
      return res.status(404).json({ message: "Court service not found" });
    }

    let pricing = await CourtServicePricing.findOne({ service });

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
    const { serviceId } = req.params;
    const { country, price, currency } = req.body;

    console.log("Service ID: ", serviceId);

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const pricing = await CourtServicePricing.findOne({
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

export const getServicesByCountry = async (req, res, next) => {
  try {
    const { country } = req.params;

    console.log("Fetching service names for country:", country);

    // Find pricing entries that contain the specified country
    const pricingEntries = await CourtServicePricing.find({
      [`pricingTiers.${country}`]: { $exists: true }
    });

    if (!pricingEntries.length) {
      return res
        .status(404)
        .json({ message: "No services found for this country" });
    }

    // Extract service ids from the pricing entries (added list)
    const serviceIds = pricingEntries.map(entry => entry.service);

    // Fetch the CourtService documents based on the serviceIds
    const services = await CourtService.find({
      _id: { $in: serviceIds }
    }).sort({ serviceNo: 1 });

    const addedList = services.map(service => {
      const pricingEntry = pricingEntries.find(
        entry => entry.service.toString() === service._id.toString()
      );

      const [price, currency] = pricingEntry.pricingTiers.get(country);

      return {
        serviceNameEnglish: service.ServiceNameEnglish,
        serviceNameArabic: service.ServiceNameArabic,
        price,
        currency,
        serviceNo: service.serviceNo
      };
    });

    const notAddedList = await CourtService.find({
      _id: { $nin: serviceIds }
    }).sort({ serviceNo: 1 });

    const notAddedListNames = notAddedList.map(service => ({
      serviceNameEnglish: service.ServiceNameEnglish,
      serviceNameArabic: service.ServiceNameArabic,
      serviceNo: service.serviceNo
    }));

    res.status(200).json({
      message: "Service names fetched successfully",
      addedList,
      notAddedList: notAddedListNames
    });
  } catch (error) {
    next(error);
  }
};
