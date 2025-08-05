import ConsultantProfile from '../../models/Consultant/ProfileModel/User.js';
import PersonalDetails from "../../models/Consultant/ProfileModel/personalDetails.js";
import BankDetails from "../../models/Consultant/ProfileModel/bankDetails.js";
import IDProof from "../../models/Consultant/ProfileModel/idProof.js";


export const generateConsultantUniqueId = async () => {
  const latestConsultant = await ConsultantProfile.findOne().sort({ creationDate: -1 });
  let newId = 1;

  if (latestConsultant && latestConsultant.consultantUniqueId) {
    const lastIdNumber = parseInt(latestConsultant.consultantUniqueId.replace('MCnslt', ""), 10);
    newId = lastIdNumber + 1;
  }

  return `MCnslt${String(newId).padStart(2, '0')}`;
};


export const isConsultantRegistrationComplete = async (consultantId) => {
  const [personalDetails, bankDetails, idProof] = await Promise.all([
    PersonalDetails.findOne({ consultantId }),
    BankDetails.findOne({ consultantId }),
    IDProof.findOne({ consultantId }),
  ]);

  const isComplete = !!(personalDetails && bankDetails && idProof);

  return {
    isComplete,
    personalDetails,
    bankDetails,
    idProof
  };
};

