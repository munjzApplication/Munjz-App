import NotaryService from "../../../../models/Admin/notaryServiceModels/notaryServiceModel.js";

export const addNotaryService = async (req, res, next) => {
  try {
    const { ServiceNameArabic, ServiceNameEnglish } = req.body;
    const existingService = await NotaryService.findOne({ ServiceNameEnglish });
    if (existingService) {
      return res.status(400).json({ message: "Notary Service already exists" });
    }
    console.log("Existing",existingService);
    
    const newService = new NotaryService({
      ServiceNameArabic,
      ServiceNameEnglish
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
    const services = await NotaryService.find();
    res.status(200).json(services);
  } catch (error) {
    next(error);
  }
};

export const updateNotaryService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ServiceNameArabic, ServiceNameEnglish } = req.body;

    const updatedService = await NotaryService.findByIdAndUpdate(
      id,
      { ServiceNameArabic, ServiceNameEnglish },
      { new: true }
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

    res.status(200).json({ message: "Notary Service deleted successfully" });
  } catch (error) {
    next(error);
  }
};
