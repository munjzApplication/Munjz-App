import ConsultationDuration from "../../models/Consultant/consultationDurationModel.js";


export const consultationDuration = async (req, res, next) => {
  try {
    const { consultationDuration } = req.body;

    if (!consultationDuration) {
      return res.status(400).json({ message: "Consultation duration is required" });
    }

    // Check if a document already exists
    const existingDuration = await ConsultationDuration.findOne();

    if (existingDuration) {
      // Update existing document
      existingDuration.consultationDuration = consultationDuration;
      await existingDuration.save();
      return res.status(200).json({
        message: "Consultation duration updated successfully",
        consultationDuration: existingDuration.consultationDuration,
      });
    }

    // Create a new document if none exists
    const newConsultationDuration = new ConsultationDuration({ consultationDuration });
    await newConsultationDuration.save();

    return res.status(201).json({
      message: "Consultation duration saved successfully",
      consultationDuration: newConsultationDuration.consultationDuration,
    });
  } catch (error) {
    next(error);
  }
};

export const getDuration = async (req, res, next) => {
    try {
      // Fetch the most recent consultation duration from the database
      const consultationduration = await ConsultationDuration.findOne();
  
      // Check if any consultation duration is found
      if (!consultationduration) {
        return res.status(404).json({ message: "No consultation duration found" });
      }
  
  
      // Respond with the fetched duration in seconds
      res.status(200).json({
        message: "Consultation Duration fetched successfully",
        consultationDuration: consultationduration.consultationDuration,
       
      });
    } catch (error) {
      next(error);
    }
  };