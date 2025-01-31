import customerProfile from "../../../models/Customer/customerModels/customerModel.js";
import { formatDate } from "../../../helper/dateFormatter.js";

export const getAllCustomerData = async (req, res) => {
  try {
    const customerData = await customerProfile.aggregate([
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          phoneNumber: 1,
          creationDate: 1,
          isBlocked: 1,
          profilePicture: 1
          // ✅ Do NOT mix exclusion (0) with inclusion (1)
        }
      },
      { $sort: { creationDate: -1 } } // Sort customers from newest to oldest
    ]);

    const categorizedCustomers = {
      active: [],
      declined: []
    };

    // Categorize customers and format date fields
    customerData.forEach(customer => {
      const formattedCustomer = {
        ...customer,
        creationDate: formatDate(customer.creationDate)
      };

      if (!customer.isBlocked) {
        categorizedCustomers.active.push(formattedCustomer);
      } else {
        categorizedCustomers.declined.push(formattedCustomer);
      }
    });

    res.status(200).json({
      message: "Customer data fetched successfully.",
      categorizedCustomers
    });
  } catch (error) {
    console.error("Error fetching customer data:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
