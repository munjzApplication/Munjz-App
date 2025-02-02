import NotaryService from "../../../../models/Admin/notaryServiceModels/notaryServiceModel.js";
import mongoose from "mongoose";
export const addNotaryService = async (req, res, next) => {
  try {
    const { ServiceNameArabic, ServiceNameEnglish } = req.body;


    const existingService = await NotaryService.findOne({ ServiceNameEnglish });
    if (existingService) {
      return res.status(400).json({ message: "Notary Service already exists" });
    }

  
    const serviceCount = await NotaryService.countDocuments();
    const serviceNo = serviceCount + 1; 

    const newService = new NotaryService({
      ServiceNameArabic,
      ServiceNameEnglish,
      serviceNo 
    });

    await newService.save();

    res.status(201).json({
      message: "Notary Service added successfully",
      service: newService
    });
  } catch (error) {
    next(error);
  }
};

export const getAllNotaryServices = async (req, res, next) => {
  try {
    const services = await NotaryService.find()
      .select("serviceNo ServiceNameArabic ServiceNameEnglish")
      .sort({ serviceNo: 1 }); 

    res.status(200).json({
      message: "Notary services fetched successfully",
      services 
    });
  } catch (error) {
    next(error);
  }
};

export const updateNotaryService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ServiceNameArabic, ServiceNameEnglish } = req.body;

    // Check if ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Find and update the Notary Service
    const updatedService = await NotaryService.findOneAndUpdate(
      { _id: id },
      { ServiceNameArabic, ServiceNameEnglish },
      { new: true } 
    );

    // If not found, return error
    if (!updatedService) {
      return res.status(404).json({ message: "Notary Service not found" });
    }
console.log(updatedService);

    res.status(200).json({
      message: "Notary Service updated successfully",
      id: updatedService._id,
      serviceNo:updatedService.serviceNo,
      ServiceNameArabic: updatedService.ServiceNameArabic,
      ServiceNameEnglish: updatedService.ServiceNameEnglish
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotaryService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedService = await NotaryService.findByIdAndDelete(id);

    if (!deletedService) {
      return res.status(404).json({ message: "Notary Service not found" });
    }

    // Optionally, reassign service numbers after deletion to maintain order
    const services = await NotaryService.find().sort({ serviceNo: 1 });
    for (let i = 0; i < services.length; i++) {
      services[i].serviceNo = i + 1;
      await services[i].save(); 
    }

    res.status(200).json({ message: "Notary Service deleted successfully" });
  } catch (error) {
    next(error);
  }
};
