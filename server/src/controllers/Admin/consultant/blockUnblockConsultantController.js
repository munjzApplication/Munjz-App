import ConsultantProfile from "../../../models/Consultant/ProfileModel/User.js";
import { notificationService } from "../../../service/sendPushNotification.js";
import { io } from "../../../socket/socketController.js";

export const blockUnblockConsultant = async (req, res, next) => {
  const { consultantId } = req.params;
  const { action } = req.body;

  try {

    const consultant = await ConsultantProfile.findById(consultantId);

    if (!consultant) {
      return res.status(404).json({
        success: false,
        message: "Consultant not found.",
      });
    }


    if (action === "block") {
      consultant.isBlocked = true;
      await notificationService.sendToConsultant(
        consultantId,
        "Account Blocked",
        "Your account has been blocked. Please contact support for assistance."
      );
    } else if (action === "unblock") {
      consultant.isBlocked = false;
      await notificationService.sendToConsultant(
        consultantId,
        "Account Unblocked",
        "Your account has been unblocked. You can now access your account."
      );
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Use 'block' or 'unblock'.",
      });
    }

    await consultant.save();

    // Emit Socket Event for Real-Time Update
    const consultantNamespace = io.of("/consultant");
    consultantNamespace.to(consultantId.toString()).emit("consultant-block-status", {
      consultantId,
      message: consultant.isBlocked
        ? "Consultant has been blocked."
        : "Consultant has been unblocked.",
      isBlockedStatus: consultant.isBlocked,
    });

    return res.status(200).json({
      message: consultant.isBlocked
        ? "Consultant has been blocked."
        : "Consultant has been unblocked.",
      isBlockedStatus: consultant.isBlocked,
    });
  } catch (error) {
    console.error("Error in isBlockedckConsultant:", error.message);
    next(error);
  }
};