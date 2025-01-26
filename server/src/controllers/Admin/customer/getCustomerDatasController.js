import customerProfile from "../../../models/Customer/customerModels/customerModel.js";
import { formatDate } from "../../../helper/dateFormatter.js";

export const getAllCustomerData = async (req, res) => {
  try {
    const customerData = await customerProfile.find(
      {},
      "-isLoggedIn -favorites -password -resetOtpExpiry -resetOtpHash"
    );

    const categorizedCustomers = {
      active: [],
      declined: []
    };

    // Categorize customers and format date fields
    customerData.forEach(customer => {
      const formattedCustomer = {
        ...customer.toObject(),
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
