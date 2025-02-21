import mongoose from "mongoose";
import customerProfile from "../../../models/Customer/customerModels/customerModel.js";
import consultantProfile from "../../../models/Consultant/User.js";
import consultationDetails from "../../../models/Customer/consultationModel/consultationModel.js";
import walletDetails from "../../../models/Customer/customerModels/walletModel.js";
import notaryService from "../../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import courtService from "../../../models/Customer/courtServiceModel/courtServiceDetailsModel.js";
import translationService from "../../../models/Customer/translationModel/translationDetails.js";
import {
  formatDate,
  formatMinutesToMMSS
} from "../../../helper/dateFormatter.js";

export const getWalletDetails = async (req, res, next) => {
  const { customerId, actionType } = req.body;

  try {
    // Fetch customer and wallet details
    const customer = await customerProfile.findById(customerId).lean();
    const wallet = await walletDetails.findOne({ customerId }).lean();

    let services = [];

    // Fetch all services if actionType is "ALL" or specific services based on actionType
    if (actionType === "ALL" || actionType === "CONSULTATION") {
      // Fetch consultations (only necessary fields) and sort by consultationDate in descending order
      const consultations = await consultationDetails
        .find({ customerId })
        .select(
          "consultantId consultationDate consultationDuration consultationRate"
        )
        .sort({ consultationDate: -1 }) // Sorting by consultationDate in descending order
        .lean();

      // Extract consultantIds and fetch consultant names
      const consultantIds = consultations.map(service => service.consultantId);
      const consultants = await consultantProfile
        .find({ _id: { $in: consultantIds } })
        .select("Name")
        .lean();

      // Map consultantId to consultantName
      const consultantMap = consultants.reduce((acc, consultant) => {
        acc[consultant._id] = consultant.Name;
        return acc;
      }, {});

      // Add consultantName, format date and duration, and map the necessary fields
      services = [
        ...services,
        ...consultations.map(service => ({
          consultantName: consultantMap[service.consultantId] || "Unknown",
          consultationDate: formatDate(service.consultationDate), // Formatting the date
          consultationDuration: formatMinutesToMMSS(
            service.consultationDuration
          ), // Formatting duration
          consultationRate: service.consultationRating,
          serviceType: "CONSULTATION"
        }))
      ];
    }

    if (actionType === "ALL" || actionType === "NOTARYSERVICE") {
      // Fetch notary services
      const notaryServices = await notaryService.find({ customerId }).lean();
      services = [
        ...services,
        ...notaryServices.map(service => ({
          ...service,
          serviceType: "NOTARYSERVICE"
        }))
      ];
    }

    if (actionType === "ALL" || actionType === "COURTSERVICE") {
      // Fetch court services
      const courtServices = await courtService.find({ customerId }).lean();
      services = [
        ...services,
        ...courtServices.map(service => ({
          ...service,
          serviceType: "COURTSERVICE"
        }))
      ];
    }

    if (actionType === "ALL" || actionType === "TRANSLATIONSERVICE") {
      // Fetch translation services
      const translationServices = await translationService
        .find({ customerId })
        .lean();
      services = [
        ...services,
        ...translationServices.map(service => ({
          ...service,
          serviceType: "TRANSLATIONSERVICE"
        }))
      ];
    }

    // Send the response
    return res.status(200).json({
      customer: {
        name: customer.Name,
        email: customer.email,
        walletBalance: wallet.balance
      },
      services
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
