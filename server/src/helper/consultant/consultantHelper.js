import ConsultantProfile from '../../models/Consultant/User.js';

export const generateConsultantUniqueId = async () => {
  const latestConsultant = await ConsultantProfile.findOne().sort({ creationDate: -1 });
  let newId = 1;

  if (latestConsultant && latestConsultant.consultantUniqueId) {
    const lastIdNumber = parseInt(latestConsultant.consultantUniqueId.replace('MCnslt', ''), 10);
    newId = lastIdNumber + 1;
  }

  return `MCnslt${String(newId).padStart(2, '0')}`;
};




