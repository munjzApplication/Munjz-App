import WithdrawalRequest from "../../../../models/Admin/consultantModels/WithdrawRequest.js";
import Notification from "../../../../models/Consultant/notification.js";

export const updateWithdrawalStatus = async (req, res , next) => {
  try {
    const { id } = req.params;
    const { status, paymentMethod, transferId } = req.body;

    const withdrawal = await WithdrawalRequest.findById(id);
    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal request not found" });
    }

    withdrawal.currentStatus = status;

    if (status === "completed") {
      if (!paymentMethod || !transferId) {
        return res.status(400).json({
          message:
            "Payment method and Transfer ID are required for completing the request"
        });
      }

      withdrawal.paymentMethod = paymentMethod;
      withdrawal.transferId = transferId;
      withdrawal.completionDate = new Date();
    }

    await withdrawal.save();
   

    const notificationMessage = `Your withdrawal request has been ${status}.`;

    const newNotification = new Notification({
      notificationDetails: {
        title: "Withdrawal Status Update",
        message: notificationMessage,
      },
      status: "unread", 
    });

    
    await newNotification.save();
    console.log(`Withdrawal request status updated to ${status}`);
    res
      .status(200)
      .json({ message: "Status updated successfully", withdrawal });
  } catch (error) {
   next(error)
  }
};
