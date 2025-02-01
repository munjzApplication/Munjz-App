import NotaryService from "../../../../models/Admin/notaryServiceModels/notaryServiceModel.js";

export const addNotaryService = async (req, res, next) => {
  try {
    const { ServiceNameArabic, ServiceNameEnglish } = req.body;

    // Check if the service already exists
    const existingService = await NotaryService.findOne({ ServiceNameEnglish });
    if (existingService) {
      return res.status(400).json({ message: "Notary Service already exists" });
    }

    // Get the count of existing services to determine the next service number
    const serviceCount = await NotaryService.countDocuments(); 
    const serviceNo = serviceCount + 1; // Increment the service count to generate the service number

    const newService = new NotaryService({
      ServiceNameArabic,
      ServiceNameEnglish,
      serviceNo,  // Assign the unique service number
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
    const services = await NotaryService.find().sort({ serviceNo: 1 }); // Sorting by serviceNo to maintain order
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

    // Optionally, reassign service numbers after deletion to maintain order
    const services = await NotaryService.find().sort({ serviceNo: 1 });
    for (let i = 0; i < services.length; i++) {
      services[i].serviceNo = i + 1;
      await services[i].save(); // Save the updated service number
    }

    res.status(200).json({ message: "Notary Service deleted successfully" });
  } catch (error) {
    next(error);
  }
};
