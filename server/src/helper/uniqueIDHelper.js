import CourtServiceCase from "../models/Customer/courtServiceModel/courtServiceDetailsModel.js";
import NotaryServiceCase from "../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import TranslationDetails from "../models/Customer/translationModel/translationDetails.js";

export const generateUniqueServiceID = async (serviceType) => {
  try {
    let latestCase;
    let newId = 1;
    let newServiceID = "";

    // Map service type to the corresponding model & ID field
    const serviceMap = {
      court: { model: CourtServiceCase, prefix: "CourtCase", idField: "courtServiceID" },
      notary: { model: NotaryServiceCase, prefix: "NotaryCase", idField: "notaryServiceID" },
      translation: { model: TranslationDetails, prefix: "Translation", idField: "translationServiceID" },
    };

    const selectedService = serviceMap[serviceType];
    if (!selectedService) {
      throw new Error("Invalid service type provided.");
    }

    // Fetch latest case based on ID
    latestCase = await selectedService.model.findOne().sort({ [selectedService.idField]: -1 }).lean();

    if (latestCase && latestCase[selectedService.idField]) {
      const lastIdString = latestCase[selectedService.idField].replace(selectedService.prefix, "");
      const lastIdNumber = parseInt(lastIdString, 10);
      if (!isNaN(lastIdNumber)) {
        newId = lastIdNumber + 1;
      }
    }

    // Generate new ID
    newServiceID = `${selectedService.prefix}${String(newId).padStart(3, "0")}`;

    return newServiceID;

  } catch (error) {
    console.error("Error generating service ID:", error);
    throw new Error("Failed to generate a unique Service ID.");
  }
};