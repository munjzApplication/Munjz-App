import mongoose from "mongoose";
import CourtCase from "../../../models/Customer/courtServiceModel/courtServiceDetailsModel.js";
import NotaryCase from "../../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import Translation from "../../../models/Customer/translationModel/translationDetails.js";
import Consultation from "../../../models/Customer/consultationModel/consultationModel.js";

export const getCustomerServices = async (req, res, next) => {
  const { customerId, category } = req.body;

  try {
    let services = [];

    const customerObjectId = new mongoose.Types.ObjectId(customerId); 

    if (category === "notaryservice") {
      services = await NotaryCase.find({ customerId }).sort({ createdAt: -1 });
    } else if (category === "courtservice") {
      services = await CourtCase.find({ customerId }).sort({ createdAt: -1 });
    } else if (category === "translation") {
      services = await Translation.find({ customerId }).sort({ createdAt: -1 });
    } else if (category === "consultation") {
      services = await Consultation.find({ customerId }).sort({ createdAt: -1 });
    } else {
      const [notaryServices, courtServices, translationServices, consultationServices] = await Promise.all([
        NotaryCase.aggregate([
          { $match: { customerId: customerObjectId } },
          { $sort: { createdAt: -1 } },
          { $addFields: { serviceType: "notaryservice" } }
        ]),
        CourtCase.aggregate([
          { $match: { customerId: customerObjectId } },
          { $sort: { createdAt: -1 } },
          { $addFields: { serviceType: "courtservice" } }
        ]),
        Translation.aggregate([
          { $match: { customerId: customerObjectId } },
          { $sort: { createdAt: -1 } },
          { $addFields: { serviceType: "translation" } }
        ]),
        Consultation.aggregate([
          { $match: { customerId: customerObjectId } },
          { $sort: { createdAt: -1 } },
          { $addFields: { serviceType: "consultation" } }
        ]),
      ]);

      services = [
        ...notaryServices,
        ...courtServices,
        ...translationServices,
        ...consultationServices
      ];
    }

    res.status(200).json({ message: "Successfully fetched all services", services });
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong!",
      error: error.message
    });
  }
};
