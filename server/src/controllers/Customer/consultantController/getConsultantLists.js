import ConsultantProfile from "../../../models/Consultant/User.js";
import PersonalDetails from "../../../models/Consultant/personalDetails.js";

export const getConsultantLists = async (req, res , next) => {
    try {
        const consultants = await ConsultantProfile.find({}).select("-password");
        if (consultants) {
        res.status(200).json({
            message: "Consultants fetched successfully.",
            consultants
        });
        } else {
        res.status(404).json({ message: "No consultants found." });
        }
    } catch (error) {
        next(error);
    }
}