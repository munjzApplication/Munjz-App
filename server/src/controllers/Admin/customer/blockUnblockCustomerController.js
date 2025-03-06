import customerProfile from "../../../models/Customer/customerModels/customerModel.js";
import { notificationService } from "../../../service/sendPushNotification.js";

export const blockUnblockCustomer = async (req, res) => {
  const { customerId } = req.params; 
  const { action } = req.body; 

  try {
    // Fetch the customer by ID
    const customer = await customerProfile.findById(customerId);

    if (!customer) {
      // If customer is not found, send a 404 response
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

      // Determine the new isBlocked status based on the action
      if (action === "block") {
        customer.isBlocked = true; // Set to blocked
        await notificationService.sendToCustomer(
          customerId,
          "Account Blocked",
          "Your account has been blocked. Please contact support for assistance."
        );
        
      } else if (action === "unblock") {
        customer.isBlocked = false; // Set to unblocked
        await notificationService.sendToCustomer(
          customerId,
          "Account Unblocked",
          "Your account has been unblocked. You can now access your account."
        );
        
      } else {
        // Handle invalid action
        return res.status(400).json({
          success: false,
          message: "Invalid action. Use 'block' or 'unblock'.",
        });
      }
  
      // Save the updated customer
      await customer.save();
  
      // Send the success response
      return res.status(200).json({
        message: customer.isBlocked
          ? "customer has been blocked."
          : "customer has been unblocked.",
        isBlockedStatus: customer.isBlocked,
      });
    } catch (error) {
      // Handle unexpected errors
      console.error("Error in isBlockedckCustomer:", error.message);
      return res.status(500).json({
        success: false,
        message: "An error occurred while processing the request.",
      });
    }
  };