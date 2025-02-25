import NotaryService from "../../../../models/Admin/notaryServiceModels/notaryServiceModel.js";
import NotaryServicePricing from "../../../../models/Admin/notaryServiceModels/notaryServicePricingModel.js";
import mongoose from "mongoose";

export const addNotaryServicePricing = async (req, res, next) => {
  try {
    const { service, country, price, currency } = req.body;

    if (!service || !country || !price || !currency) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const existingService = await NotaryService.findById(service);
    if (!existingService) {
      return res.status(404).json({ message: "Court service not found" });
    }

    const existingPricing = await NotaryServicePricing.findOne({
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

    await NotaryServicePricing.findOneAndUpdate({ service }, update, options);

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

export const getNotaryServicePricing = async (req, res, next) => {
  try {
    const { service } = req.params;

    const pricing = await NotaryServicePricing.findOne({
      service: service
    }).populate("service");

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
    pricing.pricingTiers.set(country, { price, currency });

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

    console.log("Pricing Entries:", pricingEntries);

    const serviceIds = pricingEntries.map(entry => entry.service);

    const services = await NotaryService.find({
      _id: { $in: serviceIds }
    }).sort({ serviceNo: 1 });

    console.log("Services:", services);

    const addedList = services.map(service => {
      const pricingEntry = pricingEntries.find(
        entry => entry.service.toString() === service._id.toString()
      );
      console.log("Full Pricing Tiers:", JSON.stringify(pricingEntry.pricingTiers, null, 2));
      console.log(`Checking pricing for country: ${country}`);
      
      if (!pricingEntry) {
        console.warn(`No pricing entry found for service ${service._id}`);
        return null;
      }

      const countryPricing = pricingEntry?.pricingTiers.get(country);


      console.log("Country Pricing:", countryPricing);

      if (!countryPricing) {
        console.warn(`No pricing found for country ${country} in service ${service._id}`);
        return null;
      }

      const { price, currency } = countryPricing;

      return {
        serviceId: service._id,
        serviceNameEnglish: service.ServiceNameEnglish,
        serviceNameArabic: service.ServiceNameArabic,
        price,
        currency,
        serviceNo: service.serviceNo
      };
    }).filter(Boolean);

    const notAddedList = await NotaryService.find({
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
    console.error("Error fetching notary services:", error);
    next(error);
  }
};













