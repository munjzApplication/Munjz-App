import NotaryService from "../../../../models/Admin/notaryServiceModels/notaryServiceModel.js";
import mongoose from "mongoose";
export const addNotaryService = async (req, res, next) => {
  try {
    const { ServiceNameArabic, ServiceNameEnglish } = req.body;

    const existingService = await NotaryService.findOne({
      $or: [{ ServiceNameEnglish }, { ServiceNameArabic }]
    }).lean();

    if (existingService) {
      return res.status(400).json({ message: "Notary Service already exists" });
    }

    const serviceNo = (await NotaryService.estimatedDocumentCount()) + 1;

    const newService = await NotaryService.create({
      ServiceNameArabic,
      ServiceNameEnglish,
      serviceNo
    });

    res.status(201).json({
      message: "Notary Service added successfully",
      service: {
        _id: newService._id,
        serviceNo: newService.serviceNo,
        ServiceNameArabic: newService.ServiceNameArabic,
        ServiceNameEnglish: newService.ServiceNameEnglish
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllNotaryServices = async (req, res, next) => {
  try {
    const services = await NotaryService.find(
      {},
      "serviceNo ServiceNameArabic ServiceNameEnglish"
    ).lean();

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

    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const existingService = await NotaryService.findOne({
      $or: [{ ServiceNameEnglish }, { ServiceNameArabic }],
      _id: { $ne: id } 
    }).lean();

    if (existingService) {
      return res
        .status(400)
        .json({ message: "Notary Service with these names already exists" });
    }

    const updatedService = await NotaryService.findByIdAndUpdate(
      id,
      { $set: { ServiceNameArabic, ServiceNameEnglish } },
      { new: true, lean: true }
    );

    if (!updatedService) {
      return res.status(404).json({ message: "Notary Service not found" });
    }

    res.status(200).json({
      message: "Notary Service updated successfully",
      service: updatedService
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
