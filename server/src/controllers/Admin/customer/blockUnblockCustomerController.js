import customerProfile from "../../../models/Customer/customerModels/customerModel.js";

export const blockUnblockCustomer = async (req, res) => {
  try {
    // Fetch all customers
    const customerData = await customerProfile.find();

    // Prepare response array
    const categorizedCustomers = {
      active: [],
      declined: []
    };

    // Categorize customers based on isBlocked status
    customerData.forEach(customer => {
      if (!customer.isBlocked) {
        categorizedCustomers.active.push(customer);
      } else {
        categorizedCustomers.declined.push(customer);
      }
    });

    res.status(200).json({
      message: "Customer data fetched successfully.",
      categorizedCustomers
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};