import customerProfile from "../../../models/Customer/customerModels/customerModel.js";
import { notificationService } from "../../../service/sendPushNotification.js";

export const blockUnblockCustomer = async (req, res,next) => {
  const { customerId } = req.params; 
  const { action } = req.body; 

  try {
    const customer = await customerProfile.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

      if (action === "block") {
        customer.isBlocked = true; 
        await notificationService.sendToCustomer(
          customerId,
          "Account Blocked",
          "Your account has been blocked. Please contact support for assistance."
        );
        
      } else if (action === "unblock") {
        customer.isBlocked = false; 
        await notificationService.sendToCustomer(
          customerId,
          "Account Unblocked",
          "Your account has been unblocked. You can now access your account."
        );
        
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid action. Use 'block' or 'unblock'.",
        });
      }
  
      await customer.save();
  
      return res.status(200).json({
        message: customer.isBlocked
          ? "customer has been blocked."
          : "customer has been unblocked.",
        isBlockedStatus: customer.isBlocked,
      });
    } catch (error) {
      console.error("Error in isBlockedckCustomer:", error.message);
      next(error)
    }
  };