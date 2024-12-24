import CourtService from "../../../../models/Admin/courtServiceModels/courtServiceModel.js";
import CourtServicePricing from "../../../../models/Admin/courtServiceModels/courtServicePricingModel.js";

export const addCourtService = async (req, res, next) => {
  try {
    const { ServiceNameArabic, ServiceNameEnglish } = req.body;

    const newService = new CourtService({
      ServiceNameArabic,
      ServiceNameEnglish
    });

    await newService.save();
    res.status(201).json({
      message: "Court Service added successfully",
      service: newService
    });
  } catch (error) {
    next(error);
  }
};

export const getAllCourtServices = async (req, res, next) => {
  try {
    const services = await CourtService.find();
    res.status(200).json(services);
  } catch (error) {
    next(error);
  }
};

export const updateCourtService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ServiceNameArabic, ServiceNameEnglish } = req.body;

    const updatedService = await CourtService.findByIdAndUpdate(
      id,
      { ServiceNameArabic, ServiceNameEnglish },
      { new: true }
    );

    if (!updatedService) {
      return res.status(404).json({ message: "Court Service not found" });
    }

    res.status(200).json({
      message: "Court Service updated successfully",
      service: updatedService
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCourtService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedService = await CourtService.findByIdAndDelete(id);

    if (!deletedService) {
      return res.status(404).json({ message: "Court Service not found" });
    }

    res.status(200).json({ message: "Court Service deleted successfully" });
  } catch (error) {
    next(error);
  }
};
export const getServicesByCountry = async (req, res, next) => {
  try {
    const { country } = req.params;

    const services = await CourtServicePricing.find({
      [`BigPricingMaps.${country}`]: { $exists: true }
    })
      .select("serviceId BigPricingMaps")
      .populate("serviceId", "ServiceNameEnglish");

    console.log("Fetched Services:", services);

    if (!services || services.length === 0) {
      return res
        .status(404)
        .json({ message: "No services found for this country" });
    }

    const formattedServices = services
      .map(service => {
        const BigPricingMapsObj = Object.fromEntries(service.BigPricingMaps);

        console.log("BigPricingMaps Data:", BigPricingMapsObj);

        const countryData = BigPricingMapsObj[country];

        if (!countryData || countryData.length < 2) {
          console.log(
            `Invalid countryData for serviceId ${service._id}:`,
            countryData
          );
          return null;
        }

        return {
          serviceName: service.serviceId.ServiceNameEnglish,
          price: countryData[0],
          currency: countryData[1]
        };
      })
      .filter(service => service !== null);

    res.status(200).json(formattedServices);
  } catch (error) {
    next(error);
  }
};
