import Earnings from "../../models/Consultant/consultantEarnings.js";
import ConsultantProfile from "../../models/Consultant/User.js";

export const getConsultantEarnings = async (req, res, next) => {
  try {
    const consultantId = req.user._id;

    const consultant = await ConsultantProfile.findById(consultantId);
    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }

    console.log("consultant", consultant);

    const consultantEarnings = await Earnings.findOne({
      consultantId: consultantId
    });

    console.log("consultantEarnings", consultantEarnings);

    if (!consultantEarnings) {
      return res.status(404).json({ message: "Consultant Earnings not found" });
    }

    return res.status(200).json({
      message: "Consultant Earnings successfully fetched",
      consultantEarnings
    });
  } catch (error) {
    console.error("Error fetching consultant earnings: ", error);
    return next(error);
  }
};
