import mongoose from "mongoose";
import CourtCase from "../../../models/Customer/courtServiceModel/courtServiceDetailsModel.js";
import NotaryCase from "../../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import Translation from "../../../models/Customer/translationModel/translationDetails.js";
import Consultation from "../../../models/Customer/consultationModel/consultationModel.js";
import { formatDate } from "../../../helper/dateFormatter.js";

const serviceModels = {
  notaryservice: NotaryCase,
  courtservice: CourtCase,
  translation: Translation,
  consultation: Consultation
};

export const getCustomerServices = async (req, res, next) => {
  const { customerId, category } = req.body;

  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    return res.status(400).json({ message: "Invalid customer ID" });
  }

  try {
    const customerObjectId = new mongoose.Types.ObjectId(customerId);
    let services = [];

    const formatServiceData = (doc, serviceType) => ({
      ...doc,
      serviceType,
      submittedDate: formatDate(doc.createdAt)
    });

    if (category && serviceModels[category]) {
      const docs = await serviceModels[category]
        .find({ customerId: customerObjectId }, "-__v")
        .sort({ createdAt: -1 })
        .lean();

      services = docs.map(doc => formatServiceData(doc, category));
    } else {
      const allDocs = await Promise.all(
        Object.entries(serviceModels).map(async ([type, model]) => {
          const docs = await model
            .find({ customerId: customerObjectId }, "-__v")
            .sort({ createdAt: -1 })
            .lean();

          return docs.map(doc => formatServiceData(doc, type));
        })
      );

      services = allDocs.flat();
    }

    res.status(200).json({
      message: "Successfully fetched all services",
      services
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    next(error);
  }
};
