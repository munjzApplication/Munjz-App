import customerProfile from "../../../models/Customer/customerModels/customerModel.js";
import { formatDate } from "../../../helper/dateFormatter.js";

export const getAllCustomerData = async (req, res, next) => {
  try {
    const customerData = await customerProfile.aggregate([
      {
        $lookup: {
          from: "customer_wallets",
          localField: "_id",
          foreignField: "customerId",
          as: "wallet"
        }
      },
      {
        $project: {
          _id: 1,
          customerUniqueId: 1,
          Name: 1,
          email: 1,
          phoneNumber: 1,
          creationDate: 1,
          isBlocked: 1,
          profilePhoto: 1,
          countryCode: 1,
          country: 1,
          walletBalance: {
            $ifNull: [{ $arrayElemAt: ["$wallet.balance", 0] }, 0]
          }
        }
      },
      { $sort: { creationDate: -1 } }
    ]);

    const customersData = {
      active: [],
      declined: []
    };

    customerData.forEach(customer => {
      // Format wallet balance in JavaScript
      const balance = parseFloat(customer.walletBalance).toFixed(2);
      const [whole, decimal] = balance.split(".");

      const formattedCustomer = {
        ...customer,
        creationDate: formatDate(customer.creationDate),
        walletBalance: `${whole}:${decimal}`
      };

      if (!customer.isBlocked) {
        customersData.active.push(formattedCustomer);
      } else {
        customersData.declined.push(formattedCustomer);
      }
    });

    res.status(200).json({
      message: "Customer data fetched successfully.",
      customersData
    });
  } catch (error) {
    console.error("Error fetching customer data:", error.message);
    next(error);
  }
};
