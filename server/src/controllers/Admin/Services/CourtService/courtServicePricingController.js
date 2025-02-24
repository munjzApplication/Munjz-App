import CourtService from "../../../../models/Admin/courtServiceModels/courtServiceModel.js";
import CourtServicePricing from "../../../../models/Admin/courtServiceModels/courtServicePricingModel.js";
import mongoose from "mongoose";

export const addCourtServicePricing = async (req, res, next) => {
  try {
    const { service, country, price, currency } = req.body;

    if (!service || !country || !price || !currency) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingService = await CourtService.findById(service);
    if (!existingService) {
      return res.status(404).json({ message: "Court service not found" });
    }

    const existingPricing = await CourtServicePricing.findOne({
      service,
      [`pricingTiers.${country}`]: { $exists: true }
    });
    if (existingPricing) {
      return res
        .status(400)
        .json({ message: "Pricing for this country already exists" });
    }

    const update = {
      $set: { [`pricingTiers.${country}`]: { price, currency } }
    };
    const options = { new: true, upsert: true };

    await CourtServicePricing.findOneAndUpdate({ service }, update, options);

    res.status(201).json({
      message: "New country pricing added successfully",
      service,
      country,
      price,
      currency
    });
  } catch (error) {
    next(error);
  }
};

export const getCourtServicePricing = async (req, res, next) => {
  try {
    const { serviceId } = req.params;

    const pricing = await CourtServicePricing.findOne({
      service: serviceId
    }).populate("service");

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

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const pricing = await CourtServicePricing.findOne({
      service: serviceId
    }).select("service pricingTiers");

    if (!pricing) {
      return res.status(404).json({ message: "Pricing item not found" });
    }

    if (!pricing.pricingTiers.has(country)) {
      return res
        .status(404)
        .json({ message: `No pricing found for country: ${country}` });
    }

    pricing.pricingTiers.set(country, { price, currency });

    await pricing.save();

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

    const pricingEntries = await CourtServicePricing.find({
      [`pricingTiers.${country}`]: { $exists: true }
    });

    const serviceIds = pricingEntries.map(entry => entry.service);

    const services = await CourtService.find({
      _id: { $in: serviceIds }
    }).sort({ serviceNo: 1 });

    const addedList = services.map(service => {
      const pricingEntry = pricingEntries.find(
        entry => entry.service.toString() === service._id.toString()
      );
      const { price, currency } = pricingEntry.pricingTiers.get(country);

      return {
        serviceId: service._id,
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
      serviceId: service._id,
      serviceNameEnglish: service.ServiceNameEnglish,
      serviceNameArabic: service.ServiceNameArabic,
      serviceNo: service.serviceNo
    }));

    if (!addedList.length && !notAddedListNames.length) {
      return res.status(404).json({ message: "No services found for this country" });
    }

    res.status(200).json({
      message: "Service names fetched successfully",
      addedList,
      notAddedList: notAddedListNames
    });
  } catch (error) {
    next(error);
  }
};

