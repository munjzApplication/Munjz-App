import NotaryService from "../../../../models/Admin/notaryServiceModels/notaryServiceModel.js";
import NotaryServicePricing from "../../../../models/Admin/notaryServiceModels/notaryServicePricingModel.js";
import mongoose from "mongoose";



export const addNotaryServicePricing = async (req, res, next) => {
  try {
    const { service, country, price, currency } = req.body;
    console.log("Request Body:", req.body);

    // Validate that service is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(service)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const existingService = await NotaryService.findById({_id :service});
    console.log("Existing Service:", existingService);

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
    console.error("Error:", error);
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

    if (!pricingEntries.length) {
      return res
        .status(404)
        .json({ message: "No services found for this country" });
    }

    // Extract service ids from the pricing entries (added list)
    const serviceIds = pricingEntries.map(entry => entry.service);

    // Fetch the NotaryService documents based on the serviceIds
    const services = await NotaryService.find({
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

    const notAddedList = await NotaryService.find({
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
