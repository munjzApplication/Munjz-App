import Consultant from '../../../models/Consultant/User.js';
import PersonalData from '../../../models/Consultant/personalDetails.js';

export const getAllConsultantData = async (req, res) => {
    try {
        const consultantData = await PersonalData.find();
        res.status(200).json(consultantData);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}