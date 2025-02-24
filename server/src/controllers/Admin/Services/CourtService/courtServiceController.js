import CourtService from "../../../../models/Admin/courtServiceModels/courtServiceModel.js";
import mongoose from "mongoose";

export const addCourtService = async (req, res, next) => {
  try {
    const { ServiceNameArabic, ServiceNameEnglish } = req.body;

    const existingService = await CourtService.findOne({
      $or: [
        { ServiceNameEnglish },
        { ServiceNameArabic }
      ]
    }).lean();

    if (existingService) {
      return res.status(400).json({ message: "Notary Service already exists" });
    }

    const serviceNo = (await CourtService.estimatedDocumentCount()) + 1;

    const newService = await CourtService.create({
      ServiceNameArabic,
      ServiceNameEnglish,
      serviceNo
    });

    res.status(201).json({
      message: "Court Service added successfully",
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

export const getAllCourtServices = async (req, res, next) => {
  try {
    const services = await CourtService.find({}, "serviceNo ServiceNameArabic ServiceNameEnglish").sort({ createdAt: -1 }).lean();

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

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const existingService = await CourtService.findOne({
      $or: [
        { ServiceNameEnglish },
        { ServiceNameArabic }
      ],
      _id: { $ne: id } // Exclude the current service being updated
    }).lean();

    if (existingService) {
      return res.status(400).json({ message: "Notary Service with these names already exists" });
    }

    const updatedService = await CourtService.findByIdAndUpdate(
      id,
      { $set: { ServiceNameArabic, ServiceNameEnglish } },
      { new: true, lean: true }
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

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const deletedService = await CourtService.findByIdAndDelete(id);

    if (!deletedService) {
      return res.status(404).json({ message: "Court Service not found" });
    }

    res.status(200).json({ message: "Court Service deleted successfully" });
  } catch (error) {
    next(error);
  }
};
