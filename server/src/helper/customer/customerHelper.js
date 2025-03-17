import CustomerProfile from '../../models/Customer/customerModels/customerModel.js';

export const generateCustomerUniqueId = async () => {
  const latestCustomer = await CustomerProfile.findOne().sort({ _id: -1 }); // Sort by _id to get the latest entry
  console.log("latestCustomer", latestCustomer);
  
  let newId = 1;
  
  if (latestCustomer && latestCustomer.customerUniqueId) {
      const lastIdNumber = parseInt(latestCustomer.customerUniqueId.replace("MCust", ""), 10);
      console.log("lastIdNumber", lastIdNumber);
      
      newId = lastIdNumber + 1;

      console.log("newId", newId);
  }
  
  return `MCust${String(newId).padStart(2, '0')}`;
};
