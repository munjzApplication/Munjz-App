import ConsultantProfile from "../../../models/Consultant/ProfileModel/User.js";
import { notificationService } from "../../../service/sendPushNotification.js";
export const blockUnblockConsultant = async (req, res) => {
  const { consultantId } = req.params; 
  const { action } = req.body; 

  try {
    // Fetch the consultant by ID
    const consultant = await ConsultantProfile.findById(consultantId);

    if (!consultant) {
      // If consultant is not found, send a 404 response
      return res.status(404).json({
        success: false,
        message: "Consultant not found.",
      });
    }

      // Determine the new isBlocked status based on the action
      if (action === "block") {
        consultant.isBlocked = true; // Set to blocked
        await notificationService.sendToConsultant(
          consultantId,
          "Account Blocked",
          "Your account has been blocked. Please contact support for assistance."
        );
      } else if (action === "unblock") {
        consultant.isBlocked = false; // Set to unblocked
        await notificationService.sendToConsultant(
          consultantId,
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
  
      // Save the updated consultant
      await consultant.save();
  
      // Send the success response
      return res.status(200).json({
        message: consultant.isBlocked
          ? "Consultant has been blocked."
          : "Consultant has been unblocked.",
        isBlockedStatus: consultant.isBlocked,
      });
    } catch (error) {
      // Handle unexpected errors
      console.error("Error in isBlockedckConsultant:", error.message);
      return res.status(500).json({
        success: false,
        message: "An error occurred while processing the request.",
      });
    }
  };