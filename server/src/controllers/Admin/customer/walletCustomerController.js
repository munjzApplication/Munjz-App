import customerProfile from "../../../models/Customer/customerModels/customerModel";
import consultationDetails from "../../../models/Customer/consultationModel/consultationModel.js";
import walletDetails from "../../../models/Customer/customerModels/walletModel.js";
import notaryService from "../../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js";
import courtService from "../../../models/Customer/courtServiceModel/courtServiceDetailsModel.js";
import translationService from "../../../models/Customer/translationModel/translationDetails.js";

export const getWalletDetails = async (req, res, next) => {
    const { customerId, serviceType } = req.params;

    try {
        // Fetch customer profile
        const customer = await customerProfile.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        // Fetch wallet details
        const wallet = await walletDetails.findOne({ customerId });
        if (!wallet) {
            return res.status(404).json({ message: "Wallet not found" });
        }

        let services = [];

        // Fetch services based on the selected type
        switch (serviceType) {
            case 'all':
                const [consultations, courtServices, notaries, translations] = await Promise.all([
                    consultationDetails.find({ customerId }),
                    courtService.find({ customerId }),
                    notaryService.find({ customerId }),
                    translationService.find({ customerId })
                ]);
                services = [...consultations, ...courtServices, ...notaries, ...translations];
                break;
            case 'consultation':
                services = await consultationDetails.find({ customerId });
                break;
            case 'courtservice':
                services = await courtService.find({ customerId });
                break;
            case 'notary':
                services = await notaryService.find({ customerId });
                break;
            case 'translation':
                services = await translationService.find({ customerId });
                break;
            default:
                return res.status(400).json({ message: "Invalid service type" });
        }

        res.status(200).json({
            walletBalance: wallet.balance,
            services
        });
console.log("walletBalance: wallet.balance", wallet.balance);
console.log("services", services);


    } catch (error) {
        next(error);
    }
};