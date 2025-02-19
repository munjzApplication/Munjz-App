import mongoose from "mongoose";
import customerProfile from "../../../models/Customer/customerModels/customerModel.js";
import consultationDetails from "../../../models/Customer/consultationModel/consultationModel.js";
import walletDetails from "../../../models/Customer/customerModels/walletModel.js";
import notaryService from "../../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import courtService from "../../../models/Customer/courtServiceModel/courtServiceDetailsModel.js";
import translationService from "../../../models/Customer/translationModel/translationDetails.js";
import { formatDate, formatMinutesToMMSS } from "../../../helper/dateFormatter.js";

export const getWalletDetails = async (req, res, next) => {
    const { customerId, serviceType = "all", page = 1, limit = 10 } = req.body;

    try {
        // Convert customerId to ObjectId for efficiency
        const customerObjectId = new mongoose.Types.ObjectId(customerId);

        // Fetch customer and wallet in parallel
        const [customer, wallet] = await Promise.all([
            customerProfile.findById(customerObjectId).lean(),
            walletDetails.findOne({ customerId: customerObjectId }).lean(),
        ]);

        if (!customer) return res.status(404).json({ message: "Customer not found" });
        if (!wallet) return res.status(404).json({ message: "Wallet not found" });

        // Pagination settings
        const skip = (page - 1) * limit;
        let totalServices = 0;
        let services = [];

        // Define a map for service models
        const serviceModels = {
            consultation: consultationDetails,
            courtservice: courtService,
            notaryservice: notaryService,
            translation: translationService,
        };

        // Fetch services based on serviceType
        if (serviceType === "all") {
            const servicePromises = Object.values(serviceModels).map(model =>
                model.find({ customerId: customerObjectId })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean()
            );

            services = await Promise.all(servicePromises);
            services = services.flat(); // Flatten the array of service results
            totalServices = services.length;
        } else {
            const model = serviceModels[serviceType.toLowerCase()];
            if (!model) return res.status(400).json({ message: "Invalid service type" });

            services = await model.find({ customerId: customerObjectId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            totalServices = await model.countDocuments({ customerId: customerObjectId });
        }

        // Format response data
        const formattedServices = services.map(service => ({
            ...service,
            createdAt: formatDate(service.createdAt),
            consultationDuration: service.consultationDuration
                ? formatMinutesToMMSS(service.consultationDuration / 60) // Convert seconds to minutes
                : undefined
        }));

        return res.status(200).json({
            walletBalance: wallet.balance,
            totalServices,
            services: formattedServices,
            currentPage: page,
            totalPages: Math.ceil(totalServices / limit),
        });

    } catch (error) {
        console.error("Error fetching wallet details:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
