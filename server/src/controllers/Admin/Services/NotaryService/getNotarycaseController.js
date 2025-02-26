import notaryServiceDetailsModel from "../../../../models/Customer/notaryServiceModel/notaryServiceDetailsModel.js"
import notaryServicePayment from "../../../../models/Customer/notaryServiceModel/notaryServicePayment.js"
import notaryServiceDocument from "../../../../models/Customer/notaryServiceModel/notaryServiceDocument.js"
import { formatDate } from "../../../../helper/dateFormatter.js";

export const getAllNotaryCases = async (req, res, next) => {
    try {
        let notaryCases = await notaryServiceDetailsModel.aggregate([
            {
                $lookup: {
                    from: 'customer_profiles', // Ensure this matches the name of your customer collection
                    localField: 'customerId',
                    foreignField: '_id',
                    as: 'customer'
                }
            },
            {
                $unwind: '$customer' // Flatten the customer array into a single object
            },
            {
                $project: {
                    _id: 1,
                    customerId: 1,
                    notaryServiceID: 1,
                    serviceName: 1,
                    selectedServiceCountry: 1,
                    caseDescription: 1,
                    casePaymentStatus: 1,
                    follower: 1,
                    createdAt: 1,
                    customerName: '$customer.Name',
                    customerPhone: '$customer.phoneNumber',
                    customerProfile: '$customer.profilePhoto'
                }
            },
            {
                $sort: { createdAt: -1 } // Sort the cases by createdAt in descending order (latest first)
            }
        ]);

        // Format the createdAt field using your helper function
        notaryCases = notaryCases.map(notaryCase => ({
            ...notaryCase,
            createdAt: formatDate(notaryCase.createdAt)
        }));

        res.status(200).json({
            message: "Notary cases fetched successfully",
            notaryCases
        });
        
    } catch (error) {
        next(error);
    }
};
