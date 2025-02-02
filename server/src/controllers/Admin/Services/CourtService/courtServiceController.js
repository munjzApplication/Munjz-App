import CourtService from "../../../../models/Admin/courtServiceModels/courtServiceModel.js";
import CourtServicePricing from "../../../../models/Admin/courtServiceModels/courtServicePricingModel.js";
import mongoose from "mongoose";
export const addCourtService = async (req, res, next) => {
  try {
    const { ServiceNameArabic, ServiceNameEnglish } = req.body;

    const existingService = await CourtService.findOne({ ServiceNameEnglish });
    if (existingService) {
      return res.status(400).json({ message: "Notary Service already exists" });
    }


    const serviceCount = await CourtService.countDocuments();
    const serviceNo = serviceCount + 1; 

    const newService = new CourtService({
      ServiceNameArabic,
      ServiceNameEnglish,
      serviceNo 
    });

    await newService.save();
    res.status(201).json({
      message: "Court Service added successfully",
      service : {
        _id:newService._id,
        serviceNo : newService.serviceNo,
        ServiceNameArabic : newService.ServiceNameArabic,
        ServiceNameEnglish: newService.ServiceNameEnglish

      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllCourtServices = async (req, res, next) => {
  try {
    const services = await CourtService.find()
      .select("serviceNo ServiceNameArabic ServiceNameEnglish")
      .sort({ serviceNo: 1 }); 

    res.status(200).json({
      message: "Court services fetched successfully",
      services 
    });
  } catch (error) {
    next(error);
  }
};

export const updateCourtService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ServiceNameArabic, ServiceNameEnglish } = req.body;

        // Check if ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({ message: "Invalid ID format" });
        }
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
      service:{
        _id : updatedService._id,
        serviceNo:updatedService.serviceNo,
        ServiceNameArabic:updatedService.ServiceNameArabic,
        ServiceNameEnglish:updatedService.ServiceNameEnglish
      } 
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

