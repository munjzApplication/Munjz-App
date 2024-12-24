import CourtServiceCase from "../models/Customer/courtServiceModel/courtServiceDetailsModel.js";
import NotaryServiceCase from "../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import TranslationDetails from "../models/Customer/translationModel/translationDetails.js";

export const generateUniqueServiceID = async (serviceType, req, res) => {
  try {
    let latestCase;
    let newId = 1;
    let newServiceID = "";

    // Determine which service to generate ID for
    switch(serviceType) {
      case 'court':
        latestCase = await CourtServiceCase.findOne().sort({ courtServiceID: -1 });
        if (latestCase && latestCase.courtServiceID) {
          const lastIdString = latestCase.courtServiceID.replace("CourtCase", "");
          const lastIdNumber = parseInt(lastIdString, 10);
          if (!isNaN(lastIdNumber)) newId = lastIdNumber + 1;
        }
        newServiceID = `CourtCase${String(newId).padStart(3, "0")}`;
        break;

      case 'notary':
        latestCase = await NotaryServiceCase.findOne().sort({ notaryServiceID: -1 });
        if (latestCase && latestCase.notaryServiceID) {
          const lastIdString = latestCase.notaryServiceID.replace("NotaryCase", "");
          const lastIdNumber = parseInt(lastIdString, 10);
          if (!isNaN(lastIdNumber)) newId = lastIdNumber + 1;
        }
        newServiceID = `NotaryCase${String(newId).padStart(3, "0")}`;
        break;

      case 'translation':
        latestCase = await TranslationDetails.findOne().sort({ translationServiceID: -1 });
        if (latestCase && latestCase.translationServiceID) {
          const lastIdString = latestCase.translationServiceID.replace("Translation", "");
          const lastIdNumber = parseInt(lastIdString, 10);
          if (!isNaN(lastIdNumber)) newId = lastIdNumber + 1;
        }
        newServiceID = `Translation${String(newId).padStart(3, "0")}`;
        break;

      default:
        throw new Error("Invalid service type");
    }

    return newServiceID;

  } catch (error) {
    console.error("Error generating service ID:", error);
    
  }
};
